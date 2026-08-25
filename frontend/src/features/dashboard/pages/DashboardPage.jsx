import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useProfile } from '../../../context/ProfileContext';
import { useResumes } from '../../resume/hooks/useResumes';
import PageHeader from '../../../components/layout/PageHeader';
import EmptyState from '../../../components/common/EmptyState';
import QuickActionCard from '../components/QuickActionCard';
import RecentResumeThumb from '../components/RecentResumeThumb';
import Card from '../../../components/common/Card';

const RECENT_RESUMES_LIMIT = 4;

export default function DashboardPage() {
  const { user } = useAuth();
  const { completeness } = useProfile();
  const navigate = useNavigate();
  const { resumes, isLoading } = useResumes();

  // Extract first name for greeting
  const firstName = user?.fullName?.split(' ')[0] || 'User';

  const recentResumes = [...resumes]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, RECENT_RESUMES_LIMIT);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title={`Welcome back, ${firstName} `}
        description="Here's what's happening with your job search today."
      />

      {/* Quick Actions Grid */}
      <section>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--color-primary)]">bolt</span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            title="Create New Resume"
            description="Start from scratch or use an AI template"
            icon="post_add"
            href="/my-resumes"
            colorClass="text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400"
          />
          <QuickActionCard
            title="ATS Match Checker"
            description="Compare your resume against a job description"
            icon="fact_check"
            href="/ats-checker"
            colorClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400"
          />
          <QuickActionCard
            title="AI Tailoring"
            description="Optimize existing resume for a specific role"
            icon="auto_awesome"
            href="/ai-tailor"
            colorClass="text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area (Recent Resumes) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">description</span>
              Recent Resumes
            </h2>
            <button
              onClick={() => navigate('/my-resumes')}
              className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
            >
              View All
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {recentResumes.map((resume) => (
                <RecentResumeThumb key={resume.id} resume={resume} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar / Metrics Area */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-primary)]">monitoring</span>
            Overview
          </h2>

          <Card className="p-6 bg-[var(--color-card)] border-[var(--color-border)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Profile Strength</p>
                <h3 className="text-2xl font-extrabold text-[var(--color-text-primary)] mt-1">{completeness}%</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-[var(--color-bg-main)] flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--color-text-secondary)]">person</span>
              </div>
            </div>
            <div className="mt-4 w-full bg-[var(--color-bg-main)] rounded-full h-2">
              <div className="bg-[var(--color-primary)] h-2 rounded-full transition-all duration-300" style={{ width: `${completeness}%` }} />
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-3">
              Complete your profile setup to unlock AI features.
            </p>
          </Card>

          <Card className="p-6 bg-[var(--color-card)] border-[var(--color-border)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Applications Tracked</p>
                <h3 className="text-2xl font-extrabold text-[var(--color-text-primary)] mt-1">0</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-[var(--color-bg-main)] flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--color-text-secondary)]">work</span>
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-4">
              Start tracking your job applications.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}