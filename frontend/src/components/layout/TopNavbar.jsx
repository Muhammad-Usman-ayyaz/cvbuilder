import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useUI } from '../../context/UIContext';

export default function TopNavbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const {
    openSettings,
    isNotificationsOpen,
    toggleNotifications,
    closeNotifications,
  } = useUI();

  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

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

  const notifications = [
    { id: 1, title: 'Resume ATS Score Ready', time: '5m ago', unread: true, icon: 'fact_check' },
    { id: 2, title: 'AI Tailoring complete for Software Engineer role', time: '1h ago', unread: false, icon: 'auto_fix_high' },
  ];

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
    <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 select-none shrink-0 transition-all duration-200">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] p-2 rounded-xl hover:bg-[var(--color-primary)]/10 transition-all border border-transparent hover:border-[var(--color-primary)]/20"
          aria-label="Open navigation menu"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <div className="flex items-center gap-2 truncate">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] hidden md:inline-block">
            Application /
          </span>
          <h2 className="text-base sm:text-lg font-extrabold text-[var(--color-text-primary)] tracking-tight truncate">
            {displayTitle}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Action: Create Resume Button */}
        <Link
          to="/onboarding"
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] shadow-xs hover:shadow-md hover:shadow-[var(--color-primary)]/25 hover:-translate-y-0.5 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>New Resume</span>
        </Link>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={toggleNotifications}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] p-2 rounded-xl hover:bg-[var(--color-bg-main)] border border-transparent hover:border-[var(--color-border)] transition-all relative"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {notifications.some((n) => n.unread) && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--color-primary)] ring-2 ring-[var(--color-card)] animate-pulse" />
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl">
              <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">
                    Notifications
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    {notifications.filter(n => n.unread).length} new
                  </span>
                </div>
                <button className="text-xs text-[var(--color-primary)] font-semibold hover:underline">
                  Mark all read
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[var(--color-border)]/40">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 text-xs flex items-start gap-3 hover:bg-[var(--color-bg-main)]/60 transition-colors ${
                      item.unread ? 'bg-[var(--color-primary)]/5' : ''
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] text-[var(--color-primary)] shrink-0 mt-0.5">
                      {item.icon || 'notifications'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--color-text-primary)] leading-tight">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Account Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-[var(--color-bg-main)] transition-all border border-transparent hover:border-[var(--color-border)]"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] via-indigo-500 to-[var(--color-secondary)] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-[var(--color-primary)]/20">
              {getInitials(user?.fullName)}
            </div>
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-[var(--color-text-primary)] truncate max-w-[110px]">
                {user?.fullName || 'User'}
              </span>
              <span className="text-[10px] text-[var(--color-text-secondary)]">Free Account</span>
            </div>
            <span
              className={`material-symbols-outlined text-[18px] text-[var(--color-text-secondary)] transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-[var(--color-primary)]' : ''
              }`}
            >
              keyboard_arrow_down
            </span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-[var(--color-border)] mb-1 bg-[var(--color-bg-main)]/30">
                <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                  {user?.fullName || 'User'}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>

              <div className="px-1.5 space-y-0.5">
                <Link
                  to="/onboarding"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-main)] hover:text-[var(--color-primary)] flex items-center gap-2.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">account_circle</span>
                  Edit Profile
                </Link>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    openSettings('account');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-main)] hover:text-[var(--color-primary)] flex items-center gap-2.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                  Account Settings
                </button>
              </div>

              <div className="border-t border-[var(--color-border)] my-1.5" />

              <div className="px-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl text-[var(--color-error)] hover:bg-[var(--color-error)]/10 flex items-center gap-2.5 transition-colors"
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