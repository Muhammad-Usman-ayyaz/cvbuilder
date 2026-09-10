/**
 * Defensive UUID validation helper.
 * Enforces RFC 4122 format before database queries to prevent
 * SQL injection probes, parameter tampering, and Postgres 22P02 driver errors.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id) {
    return typeof id === 'string' && UUID_REGEX.test(id.trim());
}
