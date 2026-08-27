import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import Card from '../../../components/common/Card';
import Select from '../../../components/common/Select';
import TextArea from '../../../components/common/TextArea';
import Button from '../../../components/common/Button';
import ErrorMessage from '../../../components/common/ErrorMessage';
import EmptyState from '../../../components/common/EmptyState';
import Loader from '../../../components/feedback/Loader';
import { useResumes } from '../../resume/hooks/useResumes';
import { checkAts, getAtsHistory, getAtsHistoryItem } from '../api/atsApi';
import AtsResults from '../components/AtsResults';
import AtsHistoryPanel from '../components/AtsHistoryPanel';

export default function ATSCheckerPage() {
  const { resumes, isLoading: resumesLoading } = useResumes();
  const [resumeId, setResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [resultResumeId, setResultResumeId] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [checkCount, setCheckCount] = useState(0);
  const [checkLimit, setCheckLimit] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
      loadHistory();
    } catch (err) {
      setError(err.message || 'Failed to run the ATS check.');
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Failed to load that past check.');
    }
  };

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
      ) : result ? (
        /* Results View — displayed directly without form clutter */
        <div className="space-y-6">
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

          <AtsResults result={result} />

          {/* Bottom Action Bar */}
          <div className="flex justify-center pt-2 pb-6">
            <Button onClick={handleCheckAgain} variant="primary" size="lg">
              <span className="material-symbols-outlined text-lg mr-2">refresh</span>
              Check Again / Run Another Check
            </Button>
          </div>
        </div>
      ) : (
        /* Form View */
        <div className="space-y-6">
          <Card
            title="Run a check"
            subtitle={
              checkLimit !== null
                ? `${Math.max(checkLimit - checkCount, 0)} of ${checkLimit} checks remaining`
                : undefined
            }
          >
            <form onSubmit={handleSubmit} className="space-y-4">
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
        </div>
      )}
    </div>
  );
}
