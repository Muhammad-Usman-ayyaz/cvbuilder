import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/context/AuthContext';
import { useProfile } from '../../../context/ProfileContext';
import { useUI } from '../../../context/UIContext';
import { useResumes } from '../../resume/hooks/useResumes';
import { getAtsHistory } from '../../ats/api/atsApi';
import { formatUpdatedAt } from '../../resume/utils/resumeModel';

import RecentResumeThumb from '../components/RecentResumeThumb';
import CreateResumeCard from '../components/CreateResumeCard';
import { staggerContainer } from '../../../lib/motion';

const RECENT_RESUMES_LIMIT = 3;
const ACTIVITY_LIMIT = 5;

export default function DashboardPage() {
  const { user } = useAuth();
  const { profile, completeness, missingItems } = useProfile();
  const { openCreateResume } = useUI();
  const navigate = useNavigate();
  const { resumes, isLoading } = useResumes();

  // Sort recent resumes chronologically
  const recentResumes = useMemo(() => {
    return [...resumes]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, RECENT_RESUMES_LIMIT);
  }, [resumes]);

  // Real ATS history from existing API endpoint (no duplicate requests)
  const [checks, setChecks] = useState([]);
  const [checksLoading, setChecksLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAtsHistory()
      .then((data) => {
        if (!cancelled) setChecks(data.history || []);
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

  // Map each resume ID to its latest ATS score for badge display
  const latestAtsByResumeId = useMemo(() => {
    const map = {};
    for (const c of checks) {
      if (c.resumeId && map[c.resumeId] === undefined && typeof c.overallScore === 'number') {
        map[c.resumeId] = c.overallScore;
      }
    }
    return map;
  }, [checks]);

  const resumeTitleById = useMemo(
    () => Object.fromEntries(resumes.map((r) => [r.id, r.title])),
    [resumes]
  );

  // Unified recent activity timeline
  const activity = useMemo(() => {
    const resumeEvents = resumes.map((r) => ({
      key: `resume-${r.id}`,
      icon: 'edit_document',
      label: `Updated "${r.title || 'Untitled Resume'}"`,
      timestamp: r.updatedAt,
      onClick: () => navigate(`/resume-studio/${r.id}`),
    }));
    const checkEvents = checks.map((c) => ({
      key: `check-${c.id}`,
      icon: 'fact_check',
      label: `Scored ${c.overallScore}% on "${c.resumeId ? (resumeTitleById[c.resumeId] || 'a resume') : 'Uploaded CV'}"`,
      timestamp: c.createdAt,
      onClick: () => navigate('/ats-checker', { state: { openHistoryId: c.id } }),
    }));
    return [...resumeEvents, ...checkEvents]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, ACTIVITY_LIMIT);
  }, [resumes, checks, resumeTitleById, navigate]);

  const activityLoading = isLoading || checksLoading;

  // Profile completion checklist derived purely from existing profile data
  const profileChecklist = useMemo(() => {
    const hasPersonal = Boolean((profile?.full_name || profile?.fullName) && profile?.email);
    const hasExp = Boolean(Array.isArray(profile?.experience) && profile.experience.length > 0);
    const hasEdu = Boolean(Array.isArray(profile?.education) && profile.education.length > 0);
    const hasSkills = Boolean(Array.isArray(profile?.skills) && profile.skills.length > 0);
    const hasProj = Boolean(
      (Array.isArray(profile?.projects) && profile.projects.length > 0) ||
      profile?.linkedin_url ||
      profile?.github_url ||
      profile?.portfolio_url
    );

    return [
      { label: 'Personal Information', completed: hasPersonal, weight: '+30%' },
      { label: 'Work Experience', completed: hasExp, weight: '+25%' },
      { label: 'Education History', completed: hasEdu, weight: '+20%' },
      { label: 'Skills & Proficiencies', completed: hasSkills, weight: '+15%' },
      { label: 'Projects & Links', completed: hasProj, weight: '+10%' },
    ];
  }, [profile]);

  // ATS Career Insights derived purely from existing checks data
  const atsInsights = useMemo(() => {
    if (!checks || checks.length === 0) return null;
    const total = checks.length;
    const avg = Math.round(checks.reduce((sum, c) => sum + (c.overallScore || 0), 0) / total);
    const latest = checks[0]?.overallScore;
    const prev = checks.length > 1 ? checks[1]?.overallScore : null;
    let trend = null;
    if (prev !== null && typeof latest === 'number') {
      const diff = latest - prev;
      if (diff > 0) trend = { text: `+${diff}% vs previous`, direction: 'up' };
      else if (diff < 0) trend = { text: `${diff}% vs previous`, direction: 'down' };
      else trend = { text: 'Equal to previous', direction: 'neutral' };
    }
    return { avg, total, latest, trend };
  }, [checks]);

  // Greeting based on client local time
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.fullName ? user.fullName.split(' ')[0] : (user?.email?.split('@')[0] || 'there');

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-10">
      {/* Dashboard Hero / Welcome Area */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-primary select-none">
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Career Workspace
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
              {timeGreeting}, {displayName}
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-xl leading-relaxed">
              Your career workspace is ready. Continue building your resumes, improve your ATS scores, and keep your profile up to date.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={openCreateResume}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Resume</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/ats-checker')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border hover:border-primary/40 bg-card hover:bg-bg-main text-text-primary text-xs font-semibold transition-all"
            >
              <span className="material-symbols-outlined text-[17px] text-primary">fact_check</span>
              <span>Check ATS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Primary Focus: Recent Resumes) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">description</span>
              <h3 className="text-base font-bold text-text-primary">
                Recent Resumes
              </h3>
            </div>
            {resumes.length > 0 && (
              <button
                onClick={() => navigate('/my-resumes')}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
              >
                <span>View All ({resumes.length})</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3 animate-pulse">
                  <div className="w-full aspect-[794/1100] rounded-lg bg-bg-main" />
                  <div className="h-4 bg-bg-main rounded-md w-3/4" />
                  <div className="h-3 bg-bg-main rounded-md w-1/2" />
                </div>
              ))}
            </div>
          ) : recentResumes.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-soft-primary text-primary flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[24px]">note_stack</span>
              </div>
              <h4 className="text-base font-bold text-text-primary">Your career workspace starts here</h4>
              <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                Create your first resume and build a version tailored to your professional goals.
              </p>
              <button
                type="button"
                onClick={openCreateResume}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Create Resume</span>
              </button>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4.5"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {recentResumes.map((resume) => (
                <RecentResumeThumb
                  key={resume.id}
                  resume={resume}
                  atsScore={latestAtsByResumeId[resume.id]}
                />
              ))}
              <CreateResumeCard onClick={openCreateResume} />
            </motion.div>
          )}
        </div>

        {/* Right Column: Profile Strength, ATS Insights, Activity Timeline */}
        <div className="lg:col-span-4 space-y-5">
          {/* Profile Strength Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary select-none">
                  PROFILE STRENGTH
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-text-primary">{completeness}%</span>
                  <span className="text-xs text-text-secondary font-medium">
                    {completeness >= 100
                      ? 'Fully optimized'
                      : completeness >= 60
                      ? "You're getting there"
                      : 'Needs attention'}
                  </span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-soft-primary text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-bg-main rounded-full h-2 overflow-hidden border border-border/40">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completeness}%` }}
              />
            </div>

            {/* Live Section Checklist */}
            <div className="space-y-2 pt-0.5">
              {profileChecklist.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.completed ? (
                      <span className="material-symbols-outlined text-[16px] text-emerald-500 font-bold shrink-0">
                        check_circle
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px] text-text-secondary/50 shrink-0">
                        radio_button_unchecked
                      </span>
                    )}
                    <span className={`truncate ${item.completed ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-text-secondary shrink-0 pl-2">
                    {item.completed ? 'Done' : item.weight}
                  </span>
                </div>
              ))}
            </div>

            {/* Next Best Action */}
            <div className="pt-3 border-t border-border/80 flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
                  Next best action
                </span>
                <p className="text-xs font-semibold text-text-primary truncate mt-0.5">
                  {missingItems?.[0] || (completeness >= 100 ? 'All key sections complete' : 'Update profile details')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="shrink-0 text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                <span>Edit Profile</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* AI Career Insights Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-soft-primary text-primary flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                </div>
                <span className="text-xs font-bold text-text-primary">AI Career Insights</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-bg-main border border-border text-text-secondary">
                ATS Health
              </span>
            </div>

            {atsInsights ? (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-text-secondary font-medium">Average ATS Score</span>
                    <div className="text-2xl font-extrabold text-text-primary mt-0.5">{atsInsights.avg}%</div>
                  </div>
                  {atsInsights.trend && (
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-0.5 ${
                        atsInsights.trend.direction === 'up'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : atsInsights.trend.direction === 'down'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-bg-main text-text-secondary border-border'
                      }`}>
                        <span className="material-symbols-outlined text-[13px]">
                          {atsInsights.trend.direction === 'up' ? 'trending_up' : atsInsights.trend.direction === 'down' ? 'trending_down' : 'trending_flat'}
                        </span>
                        {atsInsights.trend.text}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Based on <span className="font-semibold text-text-primary">{atsInsights.total}</span> ATS analysis runs across your resumes.
                </p>

                <div className="pt-2.5 border-t border-border/80 flex items-center justify-between">
                  <span className="text-[11px] text-text-secondary">Target score: 80%+</span>
                  <button
                    type="button"
                    onClick={() => navigate('/ats-checker')}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                  >
                    <span>View ATS Insights</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-2.5 space-y-2">
                <p className="text-xs text-text-secondary">
                  No ATS checks recorded yet. Test your resume against a job description.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/ats-checker')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <span>Run First ATS Check</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            )}
          </div>

          {/* Recent Activity Timeline Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">history</span>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Recent Activity
                </h3>
              </div>
              <span className="text-[10px] text-text-secondary font-medium">Timeline</span>
            </div>

            {activityLoading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-5 h-5 rounded-full bg-bg-main shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-bg-main rounded w-3/4" />
                      <div className="h-2.5 bg-bg-main rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="text-xs text-text-secondary py-4 text-center">
                No activity yet — update a resume or run an ATS check to build your timeline.
              </p>
            ) : (
              <div className="relative pl-5 space-y-2.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-border/70">
                {activity.map((item) => {
                  const isAts = item.icon === 'fact_check';
                  return (
                    <div
                      key={item.key}
                      onClick={item.onClick}
                      role="button"
                      tabIndex={0}
                      className="group cursor-pointer relative flex flex-col p-1.5 -ml-1.5 rounded-lg hover:bg-bg-main/80 transition-all select-none"
                    >
                      {/* Timeline Pip */}
                      <span
                        className={`absolute -left-5 top-2.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] border ring-2 ring-card ${
                          isAts
                            ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30'
                            : 'bg-primary/10 text-primary dark:text-primary-hover border-primary/30'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[10px]">{item.icon}</span>
                      </span>

                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors leading-snug line-clamp-2 block">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-text-secondary mt-0.5 block">
                          {formatUpdatedAt(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}