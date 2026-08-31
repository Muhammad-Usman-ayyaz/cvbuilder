import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../../context/ProfileContext';
import { useResumes } from '../../resume/hooks/useResumes';
import EmptyState from '../../../components/common/EmptyState';
import RecentResumeThumb from '../components/RecentResumeThumb';
import Card from '../../../components/common/Card';

const RECENT_RESUMES_LIMIT = 4;

export default function DashboardPage() {
  const { completeness } = useProfile();
  const navigate = useNavigate();
  const { resumes, isLoading } = useResumes();

  const recentResumes = [...resumes]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, RECENT_RESUMES_LIMIT);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-8">
      {/* Overview Metrics Section */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5 bg-[var(--color-card)] border-[var(--color-border)] rounded-2xl shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Profile Strength</p>
                <h3 className="text-2xl font-extrabold text-[var(--color-text-primary)] mt-1">{completeness}%</h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
            </div>
            <div className="mt-4 w-full bg-[var(--color-bg-main)] rounded-full h-2">
              <div className="bg-[var(--color-primary)] h-2 rounded-full transition-all duration-300" style={{ width: `${completeness}%` }} />
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-2.5">
              Complete your profile setup to unlock AI features.
            </p>
          </Card>

          <Card className="p-5 bg-[var(--color-card)] border-[var(--color-border)] rounded-2xl shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Applications Tracked</p>
                <h3 className="text-2xl font-extrabold text-[var(--color-text-primary)] mt-1">0</h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">work</span>
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-4">
              Start tracking your job applications.
            </p>
          </Card>
        </div>
      </section>

      {/* Recent Resumes Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">Recent Resumes</h2>
          <button
            onClick={() => navigate('/my-resumes')}
            className="text-xs font-bold text-[var(--color-primary)] hover:underline"
          >
            View All
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[794/1123] rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] animate-pulse" />
            ))}
          </div>
        ) : recentResumes.length === 0 ? (
          <EmptyState
            icon="note_stack"
            title="No resumes yet"
            description="You haven't created any resumes. Click below to start building your professional profile."
            actionLabel="Create Resume"
            actionHref="/my-resumes"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentResumes.map((resume) => (
              <RecentResumeThumb key={resume.id} resume={resume} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}