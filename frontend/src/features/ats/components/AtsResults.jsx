import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import { staggerContainer, fadeSlideUp, fadeSlideDown, fadeScale } from '../../../lib/motion';
import { scoreLabel, scoreTone, priorityBadgeVariant } from '../utils/scoreLabel';
import ScoreBar from './ScoreBar';
import ExpandableSection from './ExpandableSection';

// Maps the fixed formatting-check labels the ATS service returns to the
// editor tab most likely to fix them, so "Fix in Studio" can point at a
// specific section instead of just dumping the user on the Personal tab.
const CHECK_SECTION_MAP = {
  'Contact info present': 'personal',
  'Professional summary present': 'personal',
  'Experience section exists': 'experience',
  'Experience entries have dates': 'experience',
  'Experience entries have real descriptions': 'experience',
  'Quantified achievements present': 'experience',
  'Education section exists': 'education',
  'Skills section has real items': 'skills',
};

const TAB_LABELS = {
  personal: 'Personal',
  education: 'Education',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
};

// Order + display label for the 8 scoreBreakdown categories.
const BREAKDOWN_CATEGORIES = [
  ['keywordMatch', 'Keyword Match'],
  ['skillsAlignment', 'Skills Alignment'],
  ['experienceRelevance', 'Experience Relevance'],
  ['educationAlignment', 'Education Alignment'],
  ['titleAlignment', 'Job Title Alignment'],
  ['formatting', 'Formatting / ATS Compatibility'],
  ['achievements', 'Achievements / Impact'],
  ['overallRelevance', 'Overall Job Relevance'],
];

// Animates a score counting up from 0 to its final value when the results
// first appear, instead of snapping straight to the number. Skips the
// count-up (jumps straight to the final value) when the user has
// prefers-reduced-motion enabled.
function AnimatedScore({ value, className }) {
  const shouldReduceMotion = useReducedMotion();
  const count = useMotionValue(shouldReduceMotion ? value : 0);
  const display = useTransform(count, (latest) => `${Math.round(latest)}%`);

  useEffect(() => {
    if (shouldReduceMotion) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { duration: 0.9, ease: 'easeOut' });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, shouldReduceMotion]);

  return <motion.span className={className}>{display}</motion.span>;
}

function ScoreGauge({ score, label, sublabel }) {
  const tone = scoreTone(score);
  return (
    <motion.div
      variants={fadeScale}
      className="flex flex-col items-center justify-center text-center"
    >
      <div className={`w-24 h-24 rounded-full flex items-center justify-center ring-4 ${tone.bg} ${tone.ring}`}>
        <AnimatedScore value={score} className={`text-2xl font-extrabold ${tone.text}`} />
      </div>
      <p className="text-sm font-semibold text-text-primary mt-3">{label}</p>
      {sublabel && <p className="text-xs text-text-secondary">{sublabel}</p>}
    </motion.div>
  );
}

function KeywordChip({ label, matched }) {
  return (
    <motion.span
      variants={fadeSlideUp}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${matched ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
        }`}
    >
      <span className="material-symbols-outlined text-[14px]">{matched ? 'check' : 'close'}</span>
      {label}
    </motion.span>
  );
}

function WarningBanner({ warnings }) {
  if (!warnings || warnings.length === 0) return null;
  return (
    <motion.div
      variants={fadeSlideDown}
      initial="hidden"
      className="bg-warning/10 border border-warning/30 rounded-md p-4 flex gap-3"
    >
      <span className="material-symbols-outlined text-warning text-[20px] shrink-0">warning</span>
      <div className="space-y-1">
        {warnings.map((warning) => (
          <p key={warning} className="text-sm font-medium text-warning">{warning}</p>
        ))}
      </div>
    </motion.div>
  );
}

function FormattingCheck({ label, passed, note, sectionLabel }) {
  return (
    <motion.div variants={fadeSlideUp} className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0">
      <span
        className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${passed ? 'text-success' : 'text-error'
          }`}
      >
        {passed ? 'check_circle' : 'cancel'}
      </span>
      <div>
        <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
          {label}
          {!passed && sectionLabel && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-soft-primary px-1.5 py-0.5 rounded">
              {sectionLabel} tab
            </span>
          )}
        </p>
        <p className="text-xs text-text-secondary mt-0.5">{note}</p>
      </div>
    </motion.div>
  );
}

function FixInStudioButton({ onClick, label = 'Fix in Studio' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
    >
      <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
      {label}
    </button>
  );
}

function RequirementGroup({ title, icon, tone, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2 flex items-center gap-1.5">
        <span className={`material-symbols-outlined text-[16px] ${tone}`}>{icon}</span>
        {title} ({items.length})
      </p>
      <ul className="space-y-2">
        {items.map((req, i) => (
          <li key={i} className="text-sm bg-bg-main border border-border rounded-md p-2.5">
            <p className="text-text-primary font-medium flex items-center gap-2">
              {req.text}
              {req.isPreferred && (
                <Badge variant="neutral" size="sm">Preferred</Badge>
              )}
            </p>
            {req.evidence && <p className="text-text-secondary text-xs mt-1">{req.evidence}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContentIssueRow({ issue }) {
  return (
    <ExpandableSection
      summary={
        <div className="flex items-center gap-2">
          <Badge variant={priorityBadgeVariant(issue.priority)} size="sm">{issue.priority}</Badge>
          <p className="text-sm font-medium text-text-primary">{issue.issue}</p>
        </div>
      }
    >
      <div className="space-y-2 text-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary mb-1">Evidence</p>
          <p className="text-text-secondary italic">"{issue.evidence}"</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary mb-1">Why it matters</p>
          <p className="text-text-secondary">{issue.whyItMatters}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1">Suggestion</p>
          <p className="text-text-primary">{issue.suggestion}</p>
        </div>
      </div>
    </ExpandableSection>
  );
}

function RecommendationRow({ rec, rank }) {
  return (
    <div className="flex gap-3 p-3.5 rounded-lg border border-border bg-bg-main">
      <div className="shrink-0 w-7 h-7 rounded-full bg-soft-primary text-primary font-bold text-sm flex items-center justify-center">
        {rank}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={priorityBadgeVariant(rec.priority)} size="sm">{rec.priority} priority</Badge>
          <p className="text-sm font-semibold text-text-primary">{rec.issue}</p>
        </div>
        <p className="text-sm text-text-secondary">{rec.why}</p>
        {rec.jdRequirements?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {rec.jdRequirements.map((r) => (
              <span key={r} className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {r}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm text-text-primary"><span className="font-semibold">Action: </span>{rec.action}</p>
      </div>
    </div>
  );
}

const IMPROVE_TARGET_SCORE = 95;

export default function AtsResults({ result, resumeId, onImprove, improveDisabledReason }) {
  const { overallScore, keywordMatch, formatting, warnings, scoreBreakdown, requirements, keywords, contentIssues, recommendations, summary } = result;
  const navigate = useNavigate();

  const failedChecks = formatting.checks
    .filter((check) => !check.passed)
    .map((check) => ({ label: check.label, note: check.note, section: CHECK_SECTION_MAP[check.label] }));

  const canFixInStudio = Boolean(resumeId) && (keywordMatch.missing.length > 0 || failedChecks.length > 0);
  const canImprove = Boolean(resumeId) && typeof onImprove === 'function';
  const alreadyAtTarget = overallScore >= IMPROVE_TARGET_SCORE;

  const isLegacyReport = !scoreBreakdown && !requirements && !keywords && !contentIssues && !recommendations && !summary;

  const handleFixInStudio = () => {
    navigate(`/resume-studio/${resumeId}`, {
      state: {
        atsFix: {
          missingKeywords: keywordMatch.missing,
          failedChecks,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <WarningBanner warnings={warnings} />

      <Card>
        <motion.div
          className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 justify-center"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <ScoreGauge score={overallScore} label="ATS Score" sublabel={scoreLabel(overallScore)} />
          {!scoreBreakdown && <ScoreGauge score={keywordMatch.score} label="Keyword Match" />}
        </motion.div>

        {canImprove && (
          <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-text-secondary">
              {improveDisabledReason
                ? improveDisabledReason
                : alreadyAtTarget
                  ? `This resume is already at or above the ${IMPROVE_TARGET_SCORE}% target for this job description.`
                  : `AI can propose truthful edits aimed at reaching ~${IMPROVE_TARGET_SCORE}% for this job description.`}
            </p>
            <button
              type="button"
              onClick={onImprove}
              disabled={alreadyAtTarget || Boolean(improveDisabledReason)}
              className="inline-flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              Improve This Resume
            </button>
          </div>
        )}
      </Card>

      {isLegacyReport && (
        <div className="text-xs text-text-secondary bg-bg-main border border-border rounded-md p-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">info</span>
          Detailed report unavailable for this older check — showing the summary that was available when it ran.
        </div>
      )}

      {scoreBreakdown && (
        <Card title="Score Breakdown" subtitle="How each category contributed to your overall score">
          <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
            {BREAKDOWN_CATEGORIES.map(([key, label]) => {
              const cat = scoreBreakdown[key];
              if (!cat) return null;
              return (
                <ExpandableSection
                  key={key}
                  summary={<ScoreBar label={label} score={cat.score} priority={cat.priority} />}
                >
                  <div className="space-y-2 text-sm">
                    <p className="text-text-secondary">{cat.explanation}</p>
                    {cat.evidence?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-success mb-1">Evidence</p>
                        <ul className="list-disc list-inside text-text-secondary space-y-0.5">
                          {cat.evidence.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                    )}
                    {cat.missing?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-error mb-1">Not found in the CV</p>
                        <ul className="list-disc list-inside text-text-secondary space-y-0.5">
                          {cat.missing.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </ExpandableSection>
              );
            })}
          </motion.div>
        </Card>
      )}

      {requirements && (
        <Card title="Job Requirements" subtitle="How the resume stacks up against what the job description asks for">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <RequirementGroup title="Matched" icon="check_circle" tone="text-success" items={requirements.matched} />
            <RequirementGroup title="Partially matched" icon="adjust" tone="text-warning" items={requirements.partial} />
            <RequirementGroup title="Missing" icon="cancel" tone="text-error" items={requirements.missing} />
            <RequirementGroup title="Preferred (optional)" icon="star" tone="text-text-secondary" items={requirements.preferred} />
          </div>
        </Card>
      )}

      <Card title="Keyword Match" subtitle={`${keywordMatch.matched.length} matched · ${keywordMatch.missing.length} missing`}>
        <div className="space-y-4">
          {keywords ? (
            <>
              {keywords.missingHighPriority.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-error mb-2">High priority — missing</p>
                  <motion.div className="flex flex-wrap gap-2" variants={staggerContainer} initial="hidden" animate="show">
                    {keywords.missingHighPriority.map((kw) => <KeywordChip key={kw} label={kw} matched={false} />)}
                  </motion.div>
                </div>
              )}
              {keywords.missingMediumPriority.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-warning mb-2">Medium priority — missing</p>
                  <motion.div className="flex flex-wrap gap-2" variants={staggerContainer} initial="hidden" animate="show">
                    {keywords.missingMediumPriority.map((kw) => <KeywordChip key={kw} label={kw} matched={false} />)}
                  </motion.div>
                </div>
              )}
              {keywords.matched.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-success mb-2">Matched</p>
                  <motion.div className="flex flex-wrap gap-2" variants={staggerContainer} initial="hidden" animate="show">
                    {keywords.matched.map((kw) => <KeywordChip key={kw} label={kw} matched />)}
                  </motion.div>
                </div>
              )}
              {keywords.partial.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                    Partial — listed but not elaborated on
                  </p>
                  <motion.div className="flex flex-wrap gap-2" variants={staggerContainer} initial="hidden" animate="show">
                    {keywords.partial.map((kw) => <KeywordChip key={kw} label={kw} matched />)}
                  </motion.div>
                </div>
              )}
              {canFixInStudio && (keywords.missingHighPriority.length > 0 || keywords.missingMediumPriority.length > 0) && (
                <FixInStudioButton onClick={handleFixInStudio} />
              )}
            </>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">Matched keywords</p>
                {keywordMatch.matched.length > 0 ? (
                  <motion.div className="flex flex-wrap gap-2" variants={staggerContainer} initial="hidden" animate="show">
                    {keywordMatch.matched.map((kw) => <KeywordChip key={kw} label={kw} matched />)}
                  </motion.div>
                ) : (
                  <p className="text-sm text-text-secondary">No keywords from the job description were found in this resume.</p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Missing keywords</p>
                  {canFixInStudio && keywordMatch.missing.length > 0 && <FixInStudioButton onClick={handleFixInStudio} />}
                </div>
                {keywordMatch.missing.length > 0 ? (
                  <motion.div className="flex flex-wrap gap-2" variants={staggerContainer} initial="hidden" animate="show">
                    {keywordMatch.missing.map((kw) => <KeywordChip key={kw} label={kw} matched={false} />)}
                  </motion.div>
                ) : (
                  <p className="text-sm text-text-secondary">Every extracted keyword was found in this resume.</p>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      <Card
        title="Formatting & ATS-Friendliness"
        subtitle="Structural checks recruiters' ATS software commonly looks for"
        headerActions={
          canFixInStudio && failedChecks.length > 0 ? <FixInStudioButton onClick={handleFixInStudio} /> : null
        }
      >
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          {formatting.checks.length > 0 ? (
            formatting.checks.map((check) => (
              <FormattingCheck key={check.label} {...check} sectionLabel={TAB_LABELS[CHECK_SECTION_MAP[check.label]]} />
            ))
          ) : (
            <p className="text-sm text-text-secondary">No major ATS formatting issues detected.</p>
          )}
        </motion.div>
      </Card>

      {contentIssues && contentIssues.length > 0 && (
        <Card title="Content Quality" subtitle="Specific wording/structure issues found in the resume text">
          <motion.div className="space-y-2.5" variants={staggerContainer} initial="hidden" animate="show">
            {contentIssues.map((issue, i) => <ContentIssueRow key={i} issue={issue} />)}
          </motion.div>
        </Card>
      )}

      {recommendations && recommendations.length > 0 && (
        <Card title="Top Improvements" subtitle="Ranked by estimated impact on this job match">
          <motion.div className="space-y-2.5" variants={staggerContainer} initial="hidden" animate="show">
            {recommendations.map((rec, i) => <RecommendationRow key={i} rec={rec} rank={i + 1} />)}
          </motion.div>
        </Card>
      )}

      {summary && (
        <Card title={`Why your score is ${overallScore}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            {summary.strengths?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-success mb-2">Strengths</p>
                <ul className="list-disc list-inside text-text-secondary space-y-1">
                  {summary.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {summary.weaknesses?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-error mb-2">Weaknesses</p>
                <ul className="list-disc list-inside text-text-secondary space-y-1">
                  {summary.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
          {summary.biggestOpportunity && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">Biggest opportunity</p>
              <p className="text-sm text-text-primary">{summary.biggestOpportunity}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
