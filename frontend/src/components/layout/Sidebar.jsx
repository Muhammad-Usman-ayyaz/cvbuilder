import { NavLink } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../features/auth/context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { openSettings } = useUI();
  const { user } = useAuth();

  const menuSections = [
    {
      id: 'workspace',
      title: 'WORKSPACE',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', badge: null },
        { path: '/profile', label: 'Master Profile', icon: 'person', badge: null },
        { path: '/my-resumes', label: 'My Resumes', icon: 'description', badge: null },
        { path: '/templates', label: 'Templates', icon: 'style', badge: null },
      ]
    },
    {
      id: 'ai-tools',
      title: 'AI TOOLS',
      items: [
        { path: '/ats-checker', label: 'ATS Checker', icon: 'fact_check', badge: null },
        { path: '/ai-tailor', label: 'AI Tailoring', icon: 'auto_fix_high', badge: 'AI', badgeColor: 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-hover' },
      ]
    },
    {
      id: 'career',
      title: 'CAREER',
      items: [
        { path: '/applications', label: 'Applications', icon: 'work', badge: null },
      ]
    }
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
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col shrink-0 h-screen lg:h-auto transition-all duration-300 lg:translate-x-0 shadow-lg lg:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Top Header / Branding */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border shrink-0 bg-bg-main/40">
          <div className="flex items-center gap-3 select-none">
            <div className="h-9 w-9 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-extrabold text-text-primary tracking-tight">
                AI Resume Builder
              </span>
              <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                CAREER SUITE
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-main transition-colors"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-grow px-3 py-4 space-y-5 overflow-y-auto">
          {menuSections.map((section) => (
            <div key={section.id} className="space-y-1">
              {section.title && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary/70 select-none">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${isActive
                      ? 'bg-primary/10 text-primary font-semibold dark:bg-primary/15 dark:text-primary-hover shadow-xs'
                      : 'text-text-secondary hover:bg-bg-main hover:text-text-primary'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary" />
                      )}
                      <span
                        className={`material-symbols-outlined text-[19px] shrink-0 transition-colors duration-150 ${isActive
                          ? 'text-primary dark:text-primary-hover'
                          : 'text-text-secondary group-hover:text-text-primary'
                          }`}
                        style={{
                          fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                        }}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold border ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}

          {/* System Section */}
          <div className="pt-2 border-t border-border/60">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary/70 select-none">
              PREFERENCES
            </div>
            <button
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
                openSettings('account');
              }}
              className="w-full group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:bg-bg-main hover:text-text-primary transition-all duration-150 text-left"
            >
              <span className="material-symbols-outlined text-[19px] shrink-0 text-text-secondary group-hover:text-text-primary group-hover:rotate-45 transition-transform duration-200">
                settings
              </span>
              Settings
            </button>
          </div>
        </nav>

        {/* AI Quick Banner Card */}
        <div className="px-3 py-2">
          <div className="p-3.5 rounded-xl bg-bg-main border border-border/80 relative overflow-hidden group">
            <div className="absolute -right-3 -bottom-3 text-primary/10 text-6xl select-none pointer-events-none group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[16px] text-primary">
                verified
              </span>
              <span className="text-xs font-bold text-text-primary">
                AI Optimization
              </span>
            </div>
            <p className="text-[11px] text-text-secondary leading-tight mb-2.5">
              Elevate your ATS score by up to 45% with tailored suggestions.
            </p>
            <NavLink
              to="/ats-checker"
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline"
            >
              Check ATS Score
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </NavLink>
          </div>
        </div>

        {/* User Profile Card Footer */}
        <div className="p-3 border-t border-border bg-bg-main/30 shrink-0">
          <div className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-bg-main/80 transition-colors">
            <div className="relative shrink-0">
              <div className="h-9 w-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {getInitials(user?.fullName)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>
            <div className="min-w-0 flex-grow">
              <p className="text-xs font-bold text-text-primary truncate leading-tight">
                {user?.fullName || 'User'}
              </p>
              <p className="text-[11px] text-text-secondary truncate leading-tight">
                {user?.email || ''}
              </p>
            </div>
            <button
              onClick={() => openSettings('account')}
              className="text-text-secondary hover:text-primary p-1.5 rounded-lg hover:bg-card border border-transparent hover:border-border transition-all"
              title="Account Settings"
            >
              <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}