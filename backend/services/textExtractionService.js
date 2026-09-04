// Importing the package root ('pdf-parse') triggers a debug/test code path
// in its index.js (it tries to self-test against a bundled sample PDF at
// './test/data/...' when it can't detect a CJS `require` parent, which is
// always the case under ESM import) — a well-known gotcha with this
// package. Importing its inner lib module directly skips that entirely.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

// Below this, treat the document as unreadable/empty rather than sending a
// near-blank prompt to Gemini (wastes a call from the shared daily budget
// and can't produce a meaningful extraction anyway).
const MIN_TEXT_LENGTH = 30;

export class ExtractionError extends Error {}

// PDF's magic bytes are the literal ASCII "%PDF-". DOCX is a ZIP container
// (OOXML), so it starts with the standard ZIP local-file-header signature
// "PK\x03\x04" — the same signature every .docx/.xlsx/.pptx file starts
// with, regardless of what a client claims its Content-Type is. Checked
// against the file's actual bytes rather than trusting the client-supplied
// MIME type, which real browsers get wrong for .docx surprisingly often
// (falls back to application/octet-stream on some OS/browser combos) and
// which is trivially spoofable by an attacker anyway — an extension check
// alone is not a security boundary, but this at least confirms the bytes
// are structurally what they claim to be before anything tries to parse
// them as a PDF/DOCX.
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
 * file -> plain text, plus a small amount of document metadata pdf-parse
 * already computes for free (page count, PDF Info dictionary) that was
 * previously discarded. No binary data (and no filesystem path) ever
 * leaves this function — the buffer lives in memory for the lifetime of
 * the request and is discarded once this returns, so there is no temp
 * file to clean up.
 *
 * docMeta is used for two things, both in templateService.js: detecting a
 * PDF this app itself previously exported (via its `subject` field — see
 * templateFingerprint.js), and as input to the structural fingerprint for
 * everything else. mammoth (DOCX) doesn't expose comparable document
 * metadata through its API, so docMeta is all-null for DOCX uploads —
 * template detection for DOCX falls back to the structural signature
 * alone (see templateFingerprint.js).
 *
 * @param {Buffer} buffer
 * @param {'pdf'|'docx'} kind
 * @returns {Promise<{
 *   text: string,
 *   docMeta: { pageCount: number|null, producer: string|null, creator: string|null, subject: string|null },
 * }>}
 */
export async function extractText(buffer, kind) {
    let text;
    let docMeta = { pageCount: null, producer: null, creator: null, subject: null };
    try {
        if (kind === 'pdf') {
            const result = await pdfParse(buffer);
            text = result.text;
            docMeta = {
                pageCount: typeof result.numpages === 'number' ? result.numpages : null,
                producer: result.info?.Producer ?? null,
                creator: result.info?.Creator ?? null,
                subject: result.info?.Subject ?? null,
            };
        } else {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        }
    } catch (err) {
        // pdf-parse/mammoth throw on malformed/corrupted files — never
        // surface the library's own error message (may include internal
        // details), just signal "unreadable" to the caller.
        throw new ExtractionError('unreadable');
    }

    const trimmed = (text || '').replace(/\s+/g, ' ').trim();
    if (trimmed.length < MIN_TEXT_LENGTH) {
        throw new ExtractionError('empty');
    }

    return { text: trimmed, docMeta };
}
