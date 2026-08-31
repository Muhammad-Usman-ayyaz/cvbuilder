import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProfile } from '../../../context/ProfileContext';
import { useResumes } from '../../resume/hooks/useResumes';
import { getAtsHistory } from '../../ats/api/atsApi';
import { formatUpdatedAt } from '../../resume/utils/resumeModel';
import QuickActionCard from '../components/QuickActionCard';
import EmptyState from '../../../components/common/EmptyState';
import RecentResumeThumb from '../components/RecentResumeThumb';
import Card from '../../../components/common/Card';
import { staggerContainer, fadeSlideUp } from '../../../lib/motion';

const RECENT_RESUMES_LIMIT = 4;
const ACTIVITY_LIMIT = 6;

export default function DashboardPage() {
  const { completeness, missingItems } = useProfile();
  const navigate = useNavigate();
  const { resumes, isLoading } = useResumes();

  const recentResumes = [...resumes]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, RECENT_RESUMES_LIMIT);

  // Recent Activity feed — merged client-side from two endpoints that
  // already exist (useResumes' resumes list + /api/ats/history) rather than
  // a new backend route. Both are small per-user datasets already (resumes
  // are typically a handful; ats_checks is capped at ATS_CHECK_LIMIT, 20),
  // so merging and sorting the two arrays here is cheap and avoids adding
  // server-side aggregation for what's fundamentally a display concern.
  const [checks, setChecks] = useState([]);
  const [checksLoading, setChecksLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAtsHistory()
      .then((data) => {
        if (!cancelled) setChecks(data.history);
      })
      .catch(() => {
        if (!cancelled) setChecks([]);
      })
      .finally(() => {
        if (!cancelled) setChecksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resumeTitleById = useMemo(
    () => Object.fromEntries(resumes.map((r) => [r.id, r.title])),
    [resumes]
  );

  const activity = useMemo(() => {
    const resumeEvents = resumes.map((r) => ({
      key: `resume-${r.id}`,
      icon: 'description',
      label: `Updated "${r.title || 'Untitled Resume'}"`,
      timestamp: r.updatedAt,
      onClick: () => navigate(`/resume-studio/${r.id}`),
    }));
    const checkEvents = checks.map((c) => ({
      key: `check-${c.id}`,
      icon: 'fact_check',
      label: `Ran ATS check on "${resumeTitleById[c.resumeId] || 'a deleted resume'}" — scored ${c.overallScore}%`,
      timestamp: c.createdAt,
      onClick: () => navigate('/ats-checker', { state: { openHistoryId: c.id } }),
    }));
    return [...resumeEvents, ...checkEvents]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, ACTIVITY_LIMIT);
  }, [resumes, checks, resumeTitleById, navigate]);

  const activityLoading = isLoading || checksLoading;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-8">
      {/* Quick Actions Grid */}
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">bolt</span>
          Quick Actions
        </h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
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
            colorClass="text-primary bg-primary/10"
          />
        </motion.div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area (Recent Resumes) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">description</span>
              Recent Resumes
            </h2>
            <button
              onClick={() => navigate('/my-resumes')}
              className="text-sm font-semibold text-primary hover:underline"
            >
              View All
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="aspect-[794/1123] rounded-xl bg-card border border-border animate-pulse" />
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
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 gap-4"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {recentResumes.map((resume) => (
                <RecentResumeThumb key={resume.id} resume={resume} />
              ))}
            </motion.div>
          )}
        </div>

        {/* Sidebar / Metrics Area */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">monitoring</span>
            Overview
          </h2>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Profile Strength</p>
                <h3 className="text-2xl font-extrabold text-text-primary mt-1">{completeness}%</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-bg-main flex items-center justify-center">
                <span className="material-symbols-outlined text-text-secondary">person</span>
              </div>
            </div>
            <div className="mt-4 w-full bg-bg-main rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${completeness}%` }} />
            </div>
            <p className="text-xs text-text-secondary mt-3">
              {completeness >= 100
                ? "Your profile is fully set up — you're getting the most out of AI features."
                : `Next item: ${missingItems?.[0] || 'Complete master profile details'}`}
            </p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] font-medium text-text-secondary">Auto-fills new resumes</span>
              <button
                onClick={() => navigate('/profile')}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                Edit Profile
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </Card>

          <Card className="p-5 bg-card border-border">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">history</span>
              Recent Activity
            </h3>

            {activityLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-bg-main animate-pulse" />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="text-xs text-text-secondary py-4 text-center">
                No activity yet — create a resume or run an ATS check to see it here.
              </p>
            ) : (
              <motion.ul className="space-y-1" variants={staggerContainer} initial="hidden" animate="show">
                {activity.map((item) => (
                  <motion.li key={item.key} variants={fadeSlideUp}>
                    <motion.button
                      type="button"
                      onClick={item.onClick}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="w-full flex items-start gap-2.5 py-2 px-1.5 -mx-1.5 rounded-lg text-left hover:bg-bg-main transition-colors"
                    >
                      <span className="material-symbols-outlined text-text-secondary text-[16px] mt-0.5 shrink-0">
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs text-text-primary leading-snug line-clamp-2">
                          {item.label}
                        </span>
                        <span className="block text-[11px] text-text-secondary mt-0.5">
                          {formatUpdatedAt(item.timestamp)}
                        </span>
                      </span>
                    </motion.button>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}