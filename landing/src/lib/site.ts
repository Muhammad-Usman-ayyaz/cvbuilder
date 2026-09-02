/**
 * Shared site-wide constants — used by layout metadata, sitemap.ts,
 * robots.ts, and the OG/Twitter image routes, so the site name, URL, and
 * description only need to change in one place.
 *
 * SITE_URL defaults to a placeholder for local builds/Lighthouse runs.
 * Set NEXT_PUBLIC_SITE_URL to the real production domain before deploying
 * (see README.md).
 *
 * APP_URL points at the actual product (the existing React/Vite app) —
 * every "Sign Up" / "Get Started" CTA on this landing page links there.
 * Defaults to the local Vite dev server for local testing.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://airesumebuilder.example.com';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000';

export const SITE_NAME = 'AI Resume Builder';
export const SITE_TAGLINE = 'Build resumes that get you hired.';
export const SITE_DESCRIPTION =
  'Build a professional resume with live-preview templates, then check it against any job description with real AI-powered ATS scoring. Free to start — no credit card required.';

export const SIGNUP_URL = `${APP_URL}/signup`;
export const LOGIN_URL = `${APP_URL}/login`;
