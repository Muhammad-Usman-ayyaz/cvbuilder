import Card from '../../../components/common/Card';

function scoreTone(score) {
  if (score >= 75) return { text: 'text-success', bg: 'bg-success/10', ring: 'ring-success/20' };
  if (score >= 45) return { text: 'text-warning', bg: 'bg-warning/10', ring: 'ring-warning/20' };
  return { text: 'text-error', bg: 'bg-error/10', ring: 'ring-error/20' };
}

function ScoreGauge({ score, label }) {
  const tone = scoreTone(score);
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center ring-4 ${tone.bg} ${tone.ring}`}>
        <span className={`text-2xl font-extrabold ${tone.text}`}>{score}%</span>
      </div>
      <p className="text-sm font-semibold text-text-primary mt-3">{label}</p>
    </div>
  );
}

function KeywordChip({ label, matched }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${matched ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
        }`}
    >
      <span className="material-symbols-outlined text-[14px]">{matched ? 'check' : 'close'}</span>
      {label}
    </span>
  );
}

function WarningBanner({ warnings }) {
  if (!warnings || warnings.length === 0) return null;
  return (
    <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex gap-3">
      <span className="material-symbols-outlined text-warning text-[20px] shrink-0">warning</span>
      <div className="space-y-1">
        {warnings.map((warning) => (
          <p key={warning} className="text-sm font-medium text-warning">{warning}</p>
        ))}
      </div>
    </div>
  );
}

function FormattingCheck({ label, passed, note }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0">
      <span
        className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${passed ? 'text-success' : 'text-error'
          }`}
      >
        {passed ? 'check_circle' : 'cancel'}
      </span>
      <div>
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary mt-0.5">{note}</p>
      </div>
    </div>
  );
}

export default function AtsResults({ result }) {
  const { overallScore, keywordMatch, formatting, warnings } = result;

  return (
    <div className="space-y-6">
      <WarningBanner warnings={warnings} />

      <Card>
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 justify-center">
          <ScoreGauge score={overallScore} label="Overall ATS Score" />
          <ScoreGauge score={keywordMatch.score} label="Keyword Match" />
        </div>
      </Card>

      <Card title="Keyword Match" subtitle={`${keywordMatch.matched.length} matched · ${keywordMatch.missing.length} missing`}>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
              Matched keywords
            </p>
            {keywordMatch.matched.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {keywordMatch.matched.map((kw) => (
                  <KeywordChip key={kw} label={kw} matched />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No keywords from the job description were found in this resume.</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
              Missing keywords
            </p>
            {keywordMatch.missing.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {keywordMatch.missing.map((kw) => (
                  <KeywordChip key={kw} label={kw} matched={false} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">Every extracted keyword was found in this resume.</p>
            )}
          </div>
        </div>
      </Card>

      <Card title="Formatting & ATS-Friendliness" subtitle="Structural checks recruiters' ATS software commonly looks for">
        <div>
          {formatting.checks.map((check) => (
            <FormattingCheck key={check.label} {...check} />
          ))}
        </div>
      </Card>
    </div>
  );
}
