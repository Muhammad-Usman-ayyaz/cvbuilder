import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useResumes } from '../../features/resume/hooks/useResumes';
import { getAtsHistory } from '../../features/ats/api/atsApi';
import { formatUpdatedAt } from '../../features/resume/utils/resumeModel';

const NOTIFICATIONS_LIMIT = 5;

export default function TopNavbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const {
    openSettings,
    isNotificationsOpen,
    toggleNotifications,
    closeNotifications,
    theme,
    toggleTheme,
  } = useUI();

  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // Real recent-activity feed reused from the same /api/ats/history
  // endpoint the Dashboard's own activity feed and My Resumes' score
  // badges already call — no new backend route, and no fabricated data
  // (this dropdown previously showed two hardcoded fake notifications).
  const { resumes } = useResumes();
  const [recentChecks, setRecentChecks] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getAtsHistory()
      .then((data) => {
        if (!cancelled) setRecentChecks(data.history.slice(0, NOTIFICATIONS_LIMIT));
      })
      .catch(() => {
        if (!cancelled) setRecentChecks([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resumeTitleById = useMemo(
    () => Object.fromEntries(resumes.map((r) => [r.id, r.title])),
    [resumes]
  );

  const notifications = useMemo(
    () =>
      recentChecks.map((c) => ({
        id: c.id,
        title: `ATS check on "${resumeTitleById[c.resumeId] || 'a deleted resume'}" — scored ${c.overallScore}%`,
        time: formatUpdatedAt(c.createdAt),
        icon: 'fact_check',
        onClick: () => navigate('/ats-checker', { state: { openHistoryId: c.id } }),
      })),
    [recentChecks, resumeTitleById, navigate]
  );

  // Map routes to dynamic titles if title prop not explicitly overridden
  const routeTitles = {
    '/dashboard': 'Dashboard Overview',
    '/my-resumes': 'My Resumes',
    '/ats-checker': 'ATS Score Checker',
    '/ai-tailor': 'AI Resume Tailoring',
    '/applications': 'Job Applications Tracker',
    '/onboarding': 'Profile Setup',
  };

  const displayTitle = title || routeTitles[location.pathname] || 'AI Resume Builder';

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        closeNotifications();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeNotifications]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 select-none shrink-0 transition-all duration-200">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-text-secondary hover:text-primary p-2 rounded-xl hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
          aria-label="Open navigation menu"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <div className="flex items-center gap-2 truncate">
          <span className="text-xs font-semibold text-text-secondary hidden md:inline-block">
            Application /
          </span>
          <h2 className="text-base sm:text-lg font-extrabold text-text-primary tracking-tight truncate">
            {displayTitle}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Action: Create Resume Button */}
        <Link
          to="/onboarding"
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-primary to-primary-hover shadow-xs hover:shadow-md hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>New Resume</span>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="text-text-secondary hover:text-primary p-2 rounded-xl hover:bg-bg-main border border-transparent hover:border-border transition-all"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="material-symbols-outlined text-[22px]">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={toggleNotifications}
            className="text-text-secondary hover:text-primary p-2 rounded-xl hover:bg-bg-main border border-transparent hover:border-border transition-all relative"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-card border border-border shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl">
              <div className="px-4 py-2.5 border-b border-border">
                <span className="text-sm font-bold text-text-primary">
                  Recent Activity
                </span>
              </div>
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-xs text-text-secondary text-center">
                  No notifications yet — run an ATS check to see it here.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
                  {notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        closeNotifications();
                        item.onClick();
                      }}
                      className="w-full p-3 text-xs flex items-start gap-3 hover:bg-bg-main/60 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text-primary leading-tight line-clamp-2">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-text-secondary mt-1">
                          {item.time}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Account Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-bg-main transition-all border border-transparent hover:border-border"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary via-slate-500 to-secondary text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-primary/20">
              {getInitials(user?.fullName)}
            </div>
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-text-primary truncate max-w-[110px]">
                {user?.fullName || 'User'}
              </span>
              <span className="text-[10px] text-text-secondary truncate max-w-[110px]">
                {user?.email || ''}
              </span>
            </div>
            <span
              className={`material-symbols-outlined text-[18px] text-text-secondary transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-primary' : ''
              }`}
            >
              keyboard_arrow_down
            </span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-card border border-border shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-border mb-1 bg-bg-main/30">
                <p className="text-sm font-bold text-text-primary truncate">
                  {user?.fullName || 'User'}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>

              <div className="px-1.5 space-y-0.5">
                <Link
                  to="/onboarding"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl text-text-secondary hover:bg-bg-main hover:text-primary flex items-center gap-2.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">account_circle</span>
                  Edit Profile
                </Link>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    openSettings('account');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl text-text-secondary hover:bg-bg-main hover:text-primary flex items-center gap-2.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                  Account Settings
                </button>
              </div>

              <div className="border-t border-border my-1.5" />

              <div className="px-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl text-error hover:bg-error/10 flex items-center gap-2.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}