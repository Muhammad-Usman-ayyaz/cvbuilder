/**
 * Turns a raw value like "linkedin.com/in/alexmorgan" (no protocol) into a
 * valid absolute URL a browser will actually treat as clickable —
 * "https://linkedin.com/in/alexmorgan". Leaves values that already have a
 * protocol untouched. Returns '' for empty/whitespace input so callers can
 * safely skip rendering a link when the field wasn't filled in.
 *
 * @param {string} raw
 * @returns {string}
 */
export function toAbsoluteUrl(raw) {
    if (!raw) return '';
    const trimmed = raw.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}