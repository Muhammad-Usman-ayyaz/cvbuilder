import { useLocation } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader';
import EmptyState from '../../../components/common/EmptyState';
import Loader from '../../../components/feedback/Loader';
import { useResumes } from '../../resume/hooks/useResumes';
import ImproveResumeFlow from '../components/ImproveResumeFlow';

export default function AITailoringPage() {
  const location = useLocation();
  const { resumes, isLoading, saveResume } = useResumes();

  // Arrives via router state from the ATS Checker's "Improve This Resume"
  // button, carrying only IDs/primitives (not the resume object itself) —
  // resumes stays the single source of truth, same deep-link pattern
  // TopNavbar's notification feed already uses for the ATS Checker.
  const { resumeId, jobDescription, currentAnalysis } = location.state || {};
  const resume = resumeId ? resumes.find((r) => r.id === resumeId) : undefined;

  const hasContext = Boolean(resumeId && jobDescription && currentAnalysis);

  return (
    <div>
      <PageHeader title="AI Tailoring" description="AI-powered resume improvement, tailored to a specific job description." />

      {!hasContext ? (
        <EmptyState
          icon="auto_awesome"
          title="Start from an ATS check"
          description="AI Tailoring works from a resume you've already checked against a job description. Run an ATS check first, then click “Improve This Resume” on the results."
          actionLabel="Go to ATS Checker"
          actionHref="/ats-checker"
        />
      ) : isLoading ? (
        <Loader message="Loading your resume..." />
      ) : !resume ? (
        <EmptyState
          icon="error_outline"
          title="Resume not found"
          description="The resume this improvement was started from no longer exists."
          actionLabel="Go to My Resumes"
          actionHref="/my-resumes"
        />
      ) : (
        <ImproveResumeFlow
          resumeId={resumeId}
          resume={resume}
          jobDescription={jobDescription}
          currentAnalysis={currentAnalysis}
          saveResume={saveResume}
        />
      )}
    </div>
  );
}
