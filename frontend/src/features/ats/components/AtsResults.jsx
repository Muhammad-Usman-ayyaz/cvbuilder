import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion';
import Card from '../../../components/common/Card';
import { staggerContainer, fadeSlideUp, fadeSlideDown, fadeScale } from '../../../lib/motion';

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

function scoreTone(score) {
  if (score >= 75) return { text: 'text-success', bg: 'bg-success/10', ring: 'ring-success/20' };
  if (score >= 45) return { text: 'text-warning', bg: 'bg-warning/10', ring: 'ring-warning/20' };
  return { text: 'text-error', bg: 'bg-error/10', ring: 'ring-error/20' };
}

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

function ScoreGauge({ score, label }) {
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

const IMPROVE_TARGET_SCORE = 95;

export default function AtsResults({ result, resumeId, onImprove, improveDisabledReason }) {
  const { overallScore, keywordMatch, formatting, warnings } = result;
  const navigate = useNavigate();

  const failedChecks = formatting.checks
    .filter((check) => !check.passed)
    .map((check) => ({ label: check.label, note: check.note, section: CHECK_SECTION_MAP[check.label] }));

  const canFixInStudio = Boolean(resumeId) && (keywordMatch.missing.length > 0 || failedChecks.length > 0);
  const canImprove = Boolean(resumeId) && typeof onImprove === 'function';
  const alreadyAtTarget = overallScore >= IMPROVE_TARGET_SCORE;

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
          <ScoreGauge score={overallScore} label="Overall ATS Score" />
          <ScoreGauge score={keywordMatch.score} label="Keyword Match" />
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

      <Card title="Keyword Match" subtitle={`${keywordMatch.matched.length} matched · ${keywordMatch.missing.length} missing`}>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
              Matched keywords
            </p>
            {keywordMatch.matched.length > 0 ? (
              <motion.div className="flex flex-wrap gap-2" variants={staggerContainer} initial="hidden" animate="show">
                {keywordMatch.matched.map((kw) => (
                  <KeywordChip key={kw} label={kw} matched />
                ))}
              </motion.div>
            ) : (
              <p className="text-sm text-text-secondary">No keywords from the job description were found in this resume.</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Missing keywords
              </p>
              {canFixInStudio && keywordMatch.missing.length > 0 && (
                <FixInStudioButton onClick={handleFixInStudio} />
              )}
            </div>
            {keywordMatch.missing.length > 0 ? (
              <motion.div className="flex flex-wrap gap-2" variants={staggerContainer} initial="hidden" animate="show">
                {keywordMatch.missing.map((kw) => (
                  <KeywordChip key={kw} label={kw} matched={false} />
                ))}
              </motion.div>
            ) : (
              <p className="text-sm text-text-secondary">Every extracted keyword was found in this resume.</p>
            )}
          </div>
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
          {formatting.checks.map((check) => (
            <FormattingCheck key={check.label} {...check} sectionLabel={TAB_LABELS[CHECK_SECTION_MAP[check.label]]} />
          ))}
        </motion.div>
      </Card>
    </div>
  );
}
