import { APP_URL, LOGIN_URL, SIGNUP_URL, SITE_NAME } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: 'var(--color-border)' }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <p className="text-sm text-[var(--color-text-secondary)]">
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </p>
        <nav aria-label="Footer" className="flex items-center gap-6 text-sm text-[var(--color-text-secondary)]">
          <a href={`${APP_URL}/terms`} className="hover:text-[var(--color-text-primary)]">
            Terms &amp; Privacy
          </a>
          <a href={LOGIN_URL} className="hover:text-[var(--color-text-primary)]">
            Log in
          </a>
          <a href={SIGNUP_URL} className="hover:text-[var(--color-text-primary)]">
            Sign up
          </a>
        </nav>
      </div>
    </footer>
  );
}
