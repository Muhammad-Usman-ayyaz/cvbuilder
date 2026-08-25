import { NavLink } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../features/auth/context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { openSettings } = useUI();
  const { user } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    // { path: '/profile', label: 'Master Profile', icon: 'person' },
    { path: '/my-resumes', label: 'My Resumes', icon: 'description' },
    { path: '/resume-builder', label: 'Resume Builder', icon: 'edit_document' },
    { path: '/ats-checker', label: 'ATS Checker', icon: 'fact_check' },
    { path: '/ai-tailor', label: 'AI Tailoring', icon: 'auto_fix_high' },
    { path: '/applications', label: 'Applications', icon: 'work' },
  ];

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
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[var(--color-card)] border-r border-[var(--color-border)] flex flex-col shrink-0 h-screen lg:h-auto transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-2 select-none">
            <span
              className="material-symbols-outlined text-[var(--color-primary)] text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <span className="text-xl font-extrabold text-[var(--color-primary)] tracking-tight">
              AI Resume Builder
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                  ? 'bg-[var(--color-soft-indigo)] text-[var(--color-primary)] font-semibold'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-main)] hover:text-[var(--color-text-primary)]'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}

          <button
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
              openSettings('account');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-main)] hover:text-[var(--color-text-primary)] transition-all text-left"
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">
              settings
            </span>
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-main)]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold text-sm border border-[var(--color-primary)]/20">
              {getInitials(user?.fullName)}
            </div>
            <div className="min-w-0 flex-grow">
              <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                {user?.fullName || 'User'}
              </p>
              <p className="text-[10px] text-[var(--color-text-secondary)] truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}