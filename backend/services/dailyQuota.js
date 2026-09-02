/**
 * A coarse, in-memory, project-wide daily counter — the shared mechanism
 * behind both ATS_CHECK_DAILY_GLOBAL_LIMIT and IMPROVE_DAILY_GLOBAL_LIMIT
 * in atsController.js. The Gemini API key backing this project is on the
 * free tier: a shared 20-requests/day quota for the WHOLE PROJECT, not
 * per-user (confirmed directly via a 429 RESOURCE_EXHAUSTED error during
 * development). Both quota instances exist specifically so their combined
 * worst-case usage can be reasoned about against that one real ceiling —
 * see the budget comment in atsController.js.
 *
 * Deliberately in-memory rather than a DB counter: it only needs to survive
 * within one server process's day, and resetting on a server restart (rare
 * in practice, and "quota fully available again" is a safe failure mode) is
 * fine for this project's current scale. Revisit if this ever runs across
 * multiple backend instances, where an in-memory counter would under-count.
 *
 * @param {number} limit
 */
export function createDailyQuota(limit) {
    let count = 0;
    let dateKey = null;

    function currentUtcDateKey() {
        return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    }

    function rolloverIfNeeded() {
        const todayKey = currentUtcDateKey();
        if (dateKey !== todayKey) {
            dateKey = todayKey;
            count = 0;
        }
    }

    return {
        limit,
        /** How many reservations are left today. */
        remaining() {
            rolloverIfNeeded();
            return Math.max(0, limit - count);
        },
        /**
         * Attempts to reserve one slot from today's budget, returning
         * whether it succeeded. Reserve BEFORE calling Gemini (so
         * concurrent requests can't all slip through under the limit) and
         * call release() if the reserved call ends up failing, so a failed
         * attempt doesn't permanently cost the daily budget.
         */
        tryReserve() {
            rolloverIfNeeded();
            if (count >= limit) return false;
            count += 1;
            return true;
        },
        release() {
            count = Math.max(0, count - 1);
        },
    };
}
