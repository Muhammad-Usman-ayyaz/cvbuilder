import Link from 'next/link';
import { LOGIN_URL, SIGNUP_URL, SITE_NAME } from '@/lib/site';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg-main)]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${SITE_NAME} home`}>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #2C5282, #14B8A6)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="text-lg font-extrabold tracking-tight text-[var(--color-text-primary)]">
            {SITE_NAME}
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            How it works
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={LOGIN_URL}
            className="hidden text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] sm:block"
          >
            Log in
          </a>
          <a
            href={SIGNUP_URL}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
}
