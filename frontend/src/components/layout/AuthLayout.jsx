import { Outlet, Link } from 'react-router-dom';
import PageTransition from '../common/PageTransition';

/**
 * Shared shell for every logged-out page (login, signup, forgot-password,
 * terms). Mirrors the app's real identity — the same wordmark, icon
 * treatment, and color tokens as Sidebar.jsx — so the transition from
 * "logged out" to "logged in" isn't a jump between two different products.
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex bg-bg-main">
      {/* Left branding panel — deliberately kept dark regardless of the
          app's light/dark setting, like a product's marketing surface,
          but built from the real --color-primary/--color-secondary tokens
          instead of an unrelated accent color. */}
      <div className="hidden lg:flex lg:w-[42%] shrink-0 flex-col justify-between px-12 py-12 relative overflow-hidden bg-gradient-to-br from-primary-hover via-slate-900 to-slate-950">
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-secondary/20 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-primary/20 blur-[110px]" />

        <Link to="/login" className="relative z-10 flex items-center gap-3 w-fit select-none">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary via-slate-400 to-secondary p-[1.5px] shadow-md shadow-primary/30 flex items-center justify-center shrink-0">
            <div className="h-full w-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
            </div>
          </div>
          <span className="text-white font-extrabold text-lg tracking-tight">AI Resume Builder</span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-white text-3xl font-bold leading-tight mb-3">
            Build resumes that<br />get you hired.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Craft beautiful, ATS-optimized resumes in minutes with AI-powered tools and professional templates.
          </p>
        </div>

        <div className="relative z-10 text-white/40 text-xs">
          &copy; {new Date().getFullYear()} AI Resume Builder. All rights reserved.
        </div>
      </div>

      {/* Right panel — same bg-bg-main page background used everywhere
          else in the app; each page renders its own content in a Card,
          same as every other page's surfaces. */}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col bg-bg-main">
        <div className="flex-1 flex flex-col items-center px-6 py-10 sm:px-10">
          <Link to="/login" className="lg:hidden flex items-center gap-2 mb-8 select-none">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
            </div>
            <span className="text-text-primary font-extrabold text-lg tracking-tight">AI Resume Builder</span>
          </Link>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </div>
    </div>
  );
}
