import Card from '../../../components/common/Card';

function scoreBadgeTone(score) {
  if (score >= 75) return 'bg-success/10 text-success';
  if (score >= 45) return 'bg-warning/10 text-warning';
  return 'bg-error/10 text-error';
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AtsHistoryPanel({ history, resumeTitleById, onSelect, isLoading }) {
  if (isLoading) {
    return (
      <Card title="Past Checks">
        <p className="text-sm text-text-secondary">Loading history...</p>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card title="Past Checks">
        <p className="text-sm text-text-secondary">No checks yet — run one above and it'll show up here.</p>
      </Card>
    );
  }

  return (
    <Card title="Past Checks" subtitle={`${history.length} check${history.length === 1 ? '' : 's'}`} noPadding>
      <div className="divide-y divide-border">
        {history.map((item) => {
          // null resumeId = a check run against a CV uploaded directly to
          // the ATS Checker and never saved (see ATSCheckerPage.jsx's
          // "Upload CV" option) — distinct from a resume that once existed
          // and was later deleted.
          const resumeTitle =
            item.resumeId == null ? 'Uploaded CV (not saved)' : resumeTitleById[item.resumeId] || '(resume deleted)';
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="w-full text-left px-5 py-3 flex items-center justify-between gap-3 hover:bg-bg-main transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{resumeTitle}</p>
                <p className="text-xs text-text-secondary mt-0.5">{formatDate(item.createdAt)}</p>
              </div>
              <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-md ${scoreBadgeTone(item.overallScore)}`}>
                {item.overallScore}%
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
