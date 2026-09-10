// Importing the package root ('pdf-parse') triggers a debug/test code path
// in its index.js (it tries to self-test against a bundled sample PDF at
// './test/data/...' when it can't detect a CJS `require` parent, which is
// always the case under ESM import) — a well-known gotcha with this
// package. Importing its inner lib module directly skips that entirely.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import JSZip from 'jszip';

// Document size & extraction resource limits
const MIN_TEXT_LENGTH = 30;
const MAX_TEXT_LENGTH = 100_000; // ~20,000 words; caps extraction and token abuse
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB upload limit
const MAX_PDF_PAGES = 15; // A CV is 1-5 pages; limits PDF rendering loop to prevent CPU exhaustion
const MAX_PDF_TOTAL_PAGES = 30; // Hard rejection ceiling for book/bomb PDFs
const MAX_ZIP_ENTRIES = 100; // Normal DOCX has 10-25 entries; prevents ZIP entry flood
const MAX_ZIP_TOTAL_UNCOMPRESSED = 10 * 1024 * 1024; // 10 MB uncompressed limit across all entries
const MAX_ZIP_SINGLE_ENTRY = 4 * 1024 * 1024; // 4 MB limit on any single uncompressed XML/media entry
const MAX_COMPRESSION_RATIO = 50; // Rejects ZIP bombs where uncompressed/compressed exceeds 50x

export class ExtractionError extends Error {}

// PDF's magic bytes are the literal ASCII "%PDF-". DOCX is a ZIP container
// (OOXML), so it starts with the standard ZIP local-file-header signature
// "PK\x03\x04" — the same signature every .docx/.xlsx/.pptx file starts
// with, regardless of what a client claims its Content-Type is.
const PDF_MAGIC = Buffer.from('%PDF-', 'ascii');
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

/**
 * @param {Buffer} buffer
 * @param {'pdf'|'docx'} kind
 * @returns {boolean}
 */
export function hasValidSignature(buffer, kind) {
    if (kind === 'pdf') {
        return buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC);
    }
    return buffer.subarray(0, ZIP_MAGIC.length).equals(ZIP_MAGIC);
}

/**
 * Creates a bounded page renderer for pdf-parse that caps memory consumption
 * and string allocations during parsing rather than merely truncating afterward.
 */
function createBoundedPageRenderer(maxTextLength) {
    let accumulatedLength = 0;
    return function boundedPageRender(pageData) {
        return pageData.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false })
            .then(function(textContent) {
                if (accumulatedLength >= maxTextLength) return '';
                let lastY, text = '';
                for (const item of textContent.items) {
                    if (accumulatedLength + text.length >= maxTextLength) break;
                    if (lastY == item.transform[5] || !lastY) {
                        text += item.str;
                    } else {
                        text += '\n' + item.str;
                    }
                    lastY = item.transform[5];
                }
                accumulatedLength += text.length;
                return text;
            });
    };
}

/**
 * Audits a DOCX ZIP container before decompressing/parsing:
 * - Checks entry count, total uncompressed size, and individual entry size limits
 * - Checks compression ratio to block ZIP bombs
 * - Checks for path traversal sequences (../, absolute paths)
 * - Verifies mandatory OOXML structural components
 */
async function validateDocxArchive(buffer) {
    let zip;
    try {
        zip = await JSZip.loadAsync(buffer);
    } catch {
        throw new ExtractionError('unreadable');
    }

    const entries = Object.keys(zip.files);
    if (entries.length === 0 || entries.length > MAX_ZIP_ENTRIES) {
        throw new ExtractionError('unreadable');
    }

    let hasDocumentXml = false;
    let hasContentTypes = false;
    let totalUncompressed = 0;

    for (const [name, file] of Object.entries(zip.files)) {
        // Path traversal / absolute path check
        if (name.includes('..') || name.startsWith('/') || name.startsWith('\\') || /^[a-zA-Z]:/.test(name)) {
            throw new ExtractionError('unreadable');
        }

        if (name === 'word/document.xml') hasDocumentXml = true;
        if (name === '[Content_Types].xml') hasContentTypes = true;

        const uncompressed = file._data ? (file._data.uncompressedSize ?? 0) : 0;
        if (uncompressed > MAX_ZIP_SINGLE_ENTRY) {
            throw new ExtractionError('unreadable');
        }
        totalUncompressed += uncompressed;
    }

    // Must be a valid Word OOXML container
    if (!hasDocumentXml && !hasContentTypes) {
        throw new ExtractionError('unreadable');
    }

    // Total decompressed content limit
    if (totalUncompressed > MAX_ZIP_TOTAL_UNCOMPRESSED) {
        throw new ExtractionError('unreadable');
    }

    // ZIP bomb compression ratio check
    if (buffer.length > 0 && totalUncompressed > 500_000) {
        const ratio = totalUncompressed / buffer.length;
        if (ratio > MAX_COMPRESSION_RATIO) {
            throw new ExtractionError('unreadable');
        }
    }
}

/**
 * Extracts text and document metadata with strict parser-level resource caps.
 *
 * @param {Buffer} buffer
 * @param {'pdf'|'docx'} kind
 * @returns {Promise<{
 *   text: string,
 *   docMeta: { pageCount: number|null, producer: string|null, creator: string|null, subject: string|null },
 * }>}
 */
export async function extractText(buffer, kind) {
    if (!buffer || buffer.length > MAX_FILE_BYTES) {
        throw new ExtractionError('unreadable');
    }

    let text;
    let docMeta = { pageCount: null, producer: null, creator: null, subject: null };
    try {
        if (kind === 'pdf') {
            const boundedRenderer = createBoundedPageRenderer(MAX_TEXT_LENGTH);
            const result = await pdfParse(buffer, {
                max: MAX_PDF_PAGES,
                pagerender: boundedRenderer,
            });

            if (typeof result.numpages === 'number' && result.numpages > MAX_PDF_TOTAL_PAGES) {
                throw new ExtractionError('unreadable');
            }

            text = result.text;
            docMeta = {
                pageCount: typeof result.numpages === 'number' ? result.numpages : null,
                producer: result.info?.Producer ?? null,
                creator: result.info?.Creator ?? null,
                subject: result.info?.Subject ?? null,
            };
        } else {
            // Validate ZIP archive boundaries BEFORE decompressing with mammoth
            await validateDocxArchive(buffer);
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        }
    } catch (err) {
        if (err instanceof ExtractionError) throw err;
        // pdf-parse/mammoth throw on malformed/corrupted files — never
        // surface the library's own error message, just signal "unreadable".
        throw new ExtractionError('unreadable');
    }

    let trimmed = (text || '').replace(/\s+/g, ' ').trim();
    if (trimmed.length < MIN_TEXT_LENGTH) {
        throw new ExtractionError('empty');
    }
    if (trimmed.length > MAX_TEXT_LENGTH) {
        trimmed = trimmed.slice(0, MAX_TEXT_LENGTH);
    }

    return { text: trimmed, docMeta };
}
