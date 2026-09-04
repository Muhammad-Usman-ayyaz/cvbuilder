// Human-readable interpretation of an ATS score, derived from fixed
// thresholds rather than hardcoded per test case, so any score maps to a
// consistent label everywhere it's shown (overall score, category scores).
export function scoreLabel(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Strong';
    if (score >= 70) return 'Moderate';
    if (score >= 60) return 'Weak';
    return 'Poor';
}

export function scoreTone(score) {
    if (score >= 75) return { text: 'text-success', bg: 'bg-success/10', ring: 'ring-success/20', bar: 'bg-success' };
    if (score >= 45) return { text: 'text-warning', bg: 'bg-warning/10', ring: 'ring-warning/20', bar: 'bg-warning' };
    return { text: 'text-error', bg: 'bg-error/10', ring: 'ring-error/20', bar: 'bg-error' };
}

export function priorityBadgeVariant(priority) {
    if (priority === 'high') return 'error';
    if (priority === 'low') return 'neutral';
    return 'warning';
}
