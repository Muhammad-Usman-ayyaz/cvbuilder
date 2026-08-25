import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useUI } from '../../context/UIContext';

export default function TopNavbar({ onMenuClick, title = 'AI Resume Builder' }) {
  const { user, logout } = useAuth();
  const {
    openSettings,
    isNotificationsOpen,
    toggleNotifications,
    closeNotifications,
  } = useUI();

  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const notifications = [
    { id: 1, title: 'Resume ATS Score Ready', time: '5m ago', unread: true },
    { id: 2, title: 'AI Tailoring complete for Software Engineer role', time: '1h ago', unread: false },
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
    <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30 select-none shrink-0 transition-colors">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] p-1.5 rounded-md hover:bg-[var(--color-primary)]/5 transition-colors"
          aria-label="Open navigation menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <h2 className="text-lg font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent hidden sm:block">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={notificationRef}>
          <button
            onClick={toggleNotifications}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] p-2 rounded-full hover:bg-[var(--color-primary)]/5 transition-colors relative"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {notifications.some((n) => n.unread) && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--color-error)] ring-2 ring-[var(--color-card)]" />
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-[var(--color-border)] flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Notifications
                </span>
                <span className="text-xs text-[var(--color-primary)] font-medium cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[var(--color-border)]/50">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 text-xs hover:bg-[var(--color-bg-main)] transition-colors ${item.unread ? 'bg-[var(--color-primary)]/5' : ''
                      }`}
                  >
                    <p className="font-medium text-[var(--color-text-primary)]">{item.title}</p>
                    <p className="text-[var(--color-text-secondary)] mt-1">{item.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 hover:bg-[var(--color-primary)]/5 p-1.5 rounded-lg transition-colors border border-transparent hover:border-[var(--color-primary)]/20"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {getInitials(user?.fullName)}
            </div>
            <span className="text-sm font-semibold text-[var(--color-text-primary)] hidden md:inline-block">
              {user?.fullName || 'User'}
            </span>
            <span
              className={`material-symbols-outlined text-[18px] text-[var(--color-text-secondary)] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''
                }`}
            >
              keyboard_arrow_down
            </span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-[var(--color-border)] mb-1">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {user?.fullName || 'User'}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>

              <Link
                to="/onboarding"
                onClick={() => setIsDropdownOpen(false)}
                className="w-full text-left px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-main)] hover:text-[var(--color-primary)] flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">account_circle</span>
                Edit Profile
              </Link>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  openSettings('account');
                }}
                className="w-full text-left px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-main)] hover:text-[var(--color-primary)] flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                Settings
              </button>

              <div className="border-t border-[var(--color-border)] my-1" />

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/5 flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}