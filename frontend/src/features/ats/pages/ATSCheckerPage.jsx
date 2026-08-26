import { useState } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import Card from '../../../components/common/Card';
import Select from '../../../components/common/Select';
import TextArea from '../../../components/common/TextArea';
import Button from '../../../components/common/Button';
import ErrorMessage from '../../../components/common/ErrorMessage';
import EmptyState from '../../../components/common/EmptyState';
import Loader from '../../../components/feedback/Loader';
import { useResumes } from '../../resume/hooks/useResumes';
import { checkAts } from '../api/atsApi';
import AtsResults from '../components/AtsResults';

export default function ATSCheckerPage() {
  const { resumes, isLoading: resumesLoading } = useResumes();
  const [resumeId, setResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const resumeOptions = resumes.map((r) => ({ value: r.id, label: r.title }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
    } catch (err) {
      setError(err.message || 'Failed to run the ATS check.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="ATS Checker"
        description="Evaluate one of your resumes against a job description for keyword match and formatting issues."
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
        <div className="space-y-6">
          <Card title="Run a check">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Resume"
                id="resumeId"
                required
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                options={resumeOptions}
                placeholder="Select a resume"
              />
              <TextArea
                label="Job Description"
                id="jobDescription"
                required
                rows={8}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                helpText="Keywords, skills, and tools mentioned here are checked against the selected resume."
              />

              {error && <ErrorMessage message={error} />}

              <div className="flex justify-end">
                <Button type="submit" isLoading={isSubmitting}>
                  {isSubmitting ? 'Checking...' : 'Check Resume'}
                </Button>
              </div>
            </form>
          </Card>

          {result && <AtsResults result={result} />}
        </div>
      )}
    </div>
  );
}
