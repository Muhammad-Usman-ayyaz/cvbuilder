# AI Resume Builder — Landing Page

A standalone Next.js (App Router) marketing/SEO landing page for the AI Resume
Builder product. **This is a separate project from `../frontend`** (the
authenticated React/Vite app — dashboard, resume studio, ATS checker, etc.).
This page is what an unauthenticated visitor sees at the root domain before
they sign up; it links out to the real app for Log in / Sign up.

Nothing in `../frontend`, `../backend`, or `../ats-service` was touched to
build this.

## Folder structure

```
landing/
  src/
    app/
      layout.tsx           root layout — fonts, full <head> metadata (title,
                            description, OpenGraph, Twitter card, robots,
                            canonical)
      page.tsx              the actual landing page (Hero, Features,
                            HowItWorks, CtaBand) + JSON-LD structured data.
                            No 'use client', no data fetching — fully static.
      globals.css           same design tokens (navy/slate/teal) as
                            ../frontend/src/styles/globals.css
      sitemap.ts             generates /sitemap.xml
      robots.ts               generates /robots.txt
      opengraph-image.tsx    generates the og:image (1200x630) via next/og
      twitter-image.tsx      re-exports the same image for the Twitter card
    components/
      Header.tsx, Hero.tsx, Features.tsx, HowItWorks.tsx, CtaBand.tsx,
      Footer.tsx
    lib/
      site.ts                shared constants: site name/description/URLs,
                              and the real app's login/signup URLs
  public/
    screenshots/             real screenshots of the actual product
                              (resume-studio.png, ats-results.png), captured
                              from a live signup → resume → ATS check flow —
                              not mockups
```

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build     # production build — confirms static generation
npm run start      # serve the production build locally
```

## Configuration

Copy `.env.local.example` to `.env.local` and adjust:

- `NEXT_PUBLIC_APP_URL` — where the real app lives. Every Sign Up / Log In
  link on this page points here. Defaults to `http://localhost:4000` (the
  Vite dev server) for local testing.
- `NEXT_PUBLIC_SITE_URL` — this landing page's own public URL, used for the
  canonical link, OpenGraph `og:url`, and the sitemap. Set this to the real
  production domain before deploying.

## Deployment note (future work)

The intent, per the task this was built for, is for this page to eventually
live at the root domain (e.g. `yourdomain.com`) with the existing React app
at a subdomain or subpath (e.g. `app.yourdomain.com`). That routing/hosting
wiring is out of scope here — this project just needs `NEXT_PUBLIC_APP_URL`
pointed at wherever the real app ends up.

## What's honestly represented here

Only features that are actually built are mentioned: the live-preview
resume builder with templates, the Gemini-backed ATS Checker (real scoring,
not a placeholder), speech-to-text dictation, "Fix in Studio" deep links
from ATS results back into the editor, and PDF export. **AI Tailoring** and
**Applications Tracker** are not mentioned anywhere — both are still stub
pages in the main app.
