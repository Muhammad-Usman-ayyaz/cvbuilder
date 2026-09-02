import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../../components/layout/PageHeader';
import Card from '../../../components/common/Card';
import Select from '../../../components/common/Select';
import TextArea from '../../../components/common/TextArea';
import Button from '../../../components/common/Button';
import ErrorMessage from '../../../components/common/ErrorMessage';
import EmptyState from '../../../components/common/EmptyState';
import Loader from '../../../components/feedback/Loader';
import { useResumes } from '../../resume/hooks/useResumes';
import { checkAts, getAtsHistory, getAtsHistoryItem, getAtsServiceStatus, getImproveLimitStatus } from '../api/atsApi';
import AtsResults from '../components/AtsResults';
import AtsHistoryPanel from '../components/AtsHistoryPanel';
import ImproveResumePanel from '../components/ImproveResumePanel';
import { fadeSlideUp, fadeSlideDown } from '../../../lib/motion';

export default function ATSCheckerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resumes, isLoading: resumesLoading, saveResume } = useResumes();
  const [resumeId, setResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [result, setResult] = useState(null);
  const [resultResumeId, setResultResumeId] = useState(null);
  const [improveOpen, setImproveOpen] = useState(false);
  const [improveCount, setImproveCount] = useState(0);
  const [improveLimit, setImproveLimit] = useState(null);
  const [improveDailyRemaining, setImproveDailyRemaining] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [checkCount, setCheckCount] = useState(0);
  const [checkLimit, setCheckLimit] = useState(null);

  // Lets the page show "is the ATS service actually up" without anyone
  // needing to check terminals. null = not checked yet (renders nothing).
  const [serviceStatus, setServiceStatus] = useState(null);

  const resumeOptions = resumes.map((r) => ({ value: r.id, label: r.title }));
  const resumeTitleById = Object.fromEntries(resumes.map((r) => [r.id, r.title]));

  const isCapped = checkLimit !== null && checkCount >= checkLimit;

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await getAtsHistory();
      setHistory(data.history);
      setCheckCount(data.count);
      setCheckLimit(data.limit);
    } catch {
      // History is supplementary — a failed load shouldn't block the page.
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    getAtsServiceStatus()
      .then((data) => setServiceStatus(data.available))
      .catch(() => setServiceStatus(null));
  }, []);

  const loadImproveLimit = useCallback(async () => {
    try {
      const data = await getImproveLimitStatus();
      setImproveCount(data.count);
      setImproveLimit(data.limit);
      setImproveDailyRemaining(data.dailyGlobalRemaining);
    } catch {
      // Non-critical — the Improve button just won't preemptively disable;
      // the backend still enforces both caps server-side either way.
    }
  }, []);

  useEffect(() => {
    loadImproveLimit();
  }, [loadImproveLimit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setServiceUnavailable(false);

    if (isCapped) {
      setError(`You've used all ${checkLimit} of your ATS checks.`);
      return;
    }
    if (!resumeId) {
      setError('Please select a resume.');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please paste a job description.');
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    try {
      const data = await checkAts({ resumeId, jobDescription });
      setResult(data);
      setResultResumeId(resumeId);
      setServiceStatus(true);
      loadHistory();
    } catch (err) {
      if (err.code === 'ATS_SERVICE_UNAVAILABLE') {
        setServiceUnavailable(true);
        setServiceStatus(false);
      } else {
        setError(err.message || 'Failed to run the ATS check.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckAgain = () => {
    setResult(null);
    setResultResumeId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHistory = async (id) => {
    setError('');
    try {
      const item = await getAtsHistoryItem(id);
      setResult(item.result);
      setResultResumeId(item.resumeId);
      setJobDescription(item.jobDescription || '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Failed to load that past check.');
    }
  };

  // Deep link from the Dashboard's Recent Activity feed — arrives via
  // router state (never persisted) naming a specific past check to open
  // immediately. Cleared right away so a refresh/back doesn't reopen it.
  useEffect(() => {
    const openHistoryId = location.state?.openHistoryId;
    if (openHistoryId) {
      handleSelectHistory(openHistoryId);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumeStillExists = Boolean(resultResumeId && resumeTitleById[resultResumeId]);
  const activeResume = resumes.find((r) => r.id === resultResumeId);
  const selectedResumeTitle = resumeTitleById[resultResumeId] || '(resume deleted)';

  return (
    <div>
      <PageHeader
        title="ATS Checker"
        description="Check a resume against a job description for keyword match and formatting issues. Results replace this form until you click Check Again."
      />

      {resumesLoading ? (
        <Loader message="Loading your resumes..." />
      ) : resumes.length === 0 ? (
        <EmptyState
          icon="fact_check"
          title="No resumes yet"
          description="Create a resume first, then come back here to check it against a job description."
          actionLabel="Create a resume"
          actionHref="/my-resumes"
        />
      ) : (
        <AnimatePresence mode="wait">
          {result ? (
            /* Results View — displayed directly without form clutter */
            <motion.div
              key="results"
              variants={fadeSlideUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-xl border border-border shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">fact_check</span>
                    <h2 className="text-lg font-bold text-text-primary">ATS Analysis Report</h2>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    Resume: <span className="font-semibold text-text-primary">{selectedResumeTitle}</span>
                  </p>
                </div>
                <Button onClick={handleCheckAgain} variant="secondary" size="md">
                  <span className="material-symbols-outlined text-base mr-1.5">refresh</span>
                  Check Again
                </Button>
              </div>

              <AtsResults
                result={result}
                resumeId={resumeStillExists ? resultResumeId : null}
                onImprove={activeResume ? () => setImproveOpen(true) : undefined}
                improveDisabledReason={
                  improveLimit !== null && improveCount >= improveLimit
                    ? `You've used all ${improveLimit} of your resume improvements.`
                    : improveDailyRemaining === 0
                      ? 'The daily AI usage limit for resume improvements has been reached for all users. Please try again tomorrow.'
                      : null
                }
              />

              {/* Bottom Action Bar */}
              <div className="flex justify-center pt-2 pb-6">
                <Button onClick={handleCheckAgain} variant="primary" size="lg">
                  <span className="material-symbols-outlined text-lg mr-2">refresh</span>
                  Check Again / Run Another Check
                </Button>
              </div>
            </motion.div>
          ) : (
            /* Form View */
            <motion.div
              key="form"
              variants={fadeSlideUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="space-y-6"
            >
              <Card
                title="Run a check"
                subtitle={
                  checkLimit !== null
                    ? `${Math.max(checkLimit - checkCount, 0)} of ${checkLimit} checks remaining`
                    : undefined
                }
                headerActions={
                  serviceStatus === false ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-error">
                      <span className="w-1.5 h-1.5 rounded-full bg-error" />
                      Service offline
                    </span>
                  ) : serviceStatus === true ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      Service online
                    </span>
                  ) : null
                }
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence>
                    {serviceUnavailable && (
                      <motion.div
                        variants={fadeSlideDown}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="bg-error text-white rounded-lg p-4 flex gap-3 items-start"
                        role="alert"
                      >
                        <span className="material-symbols-outlined text-[22px] shrink-0">cloud_off</span>
                        <div>
                          <h5 className="font-bold">ATS analysis service unavailable</h5>
                          <p className="text-sm text-white/90 mt-0.5">
                            The ATS analysis service is currently unavailable. Your check did not run — please try again shortly.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {isCapped && (
                    <ErrorMessage
                      title="Check limit reached"
                      message={`You've used all ${checkLimit} of your ATS checks.`}
                    />
                  )}
                  <Select
                label="Resume"
                id="resumeId"
                required
                disabled={isCapped}
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                options={resumeOptions}
                placeholder="Select a resume"
              />
              <TextArea
                label="Job Description"
                id="jobDescription"
                required
                disabled={isCapped}
                rows={8}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                helpText="Keywords, skills, and tools mentioned here are checked against the selected resume."
              />

              {error && !isCapped && <ErrorMessage message={error} />}

              <div className="flex justify-end">
                <Button type="submit" isLoading={isSubmitting} disabled={isCapped}>
                  {isSubmitting ? 'Checking...' : 'Check Resume'}
                </Button>
              </div>
            </form>
          </Card>

              <AtsHistoryPanel
                history={history}
                resumeTitleById={resumeTitleById}
                onSelect={handleSelectHistory}
                isLoading={historyLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {activeResume && (
        <ImproveResumePanel
          isOpen={improveOpen}
          onClose={() => setImproveOpen(false)}
          resumeId={resultResumeId}
          resume={activeResume}
          jobDescription={jobDescription}
          currentAnalysis={result}
          saveResume={saveResume}
          onUsed={loadImproveLimit}
        />
      )}
    </div>
  );
}
