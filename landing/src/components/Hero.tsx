import Image from 'next/image';
import resumeStudioShot from '../../public/screenshots/resume-studio.png';
import { SIGNUP_URL } from '@/lib/site';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
        style={{ background: 'linear-gradient(180deg, var(--color-soft-primary) 0%, transparent 100%)' }}
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:py-24 lg:grid-cols-2">
        <div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              borderColor: 'color-mix(in srgb, var(--color-primary) 25%, transparent)',
              color: 'var(--color-primary-on-soft)',
              backgroundColor: 'var(--color-soft-primary)',
            }}
          >
            Free to start · No credit card
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-[var(--color-text-primary)] sm:text-5xl">
            Build a resume that actually gets past the ATS.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            Write your resume with a live-preview editor and professional templates, then check it
            against any job description with real AI-powered ATS scoring — keyword match, formatting
            checks, and exactly what to fix, before you hit submit.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={SIGNUP_URL}
              className="inline-flex items-center justify-center rounded-lg px-6 py-3.5 text-base font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Build your resume — it&apos;s free
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-lg border px-6 py-3.5 text-base font-semibold text-[var(--color-text-primary)]"
              style={{ borderColor: 'var(--color-border)' }}
            >
              See how it works
            </a>
          </div>

          <p className="mt-4 text-xs text-[var(--color-text-secondary)]">
            No credit card required. Export your first resume as a PDF in minutes.
          </p>
        </div>

        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute -inset-4 -z-10 rounded-3xl blur-2xl"
            style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 18%, transparent), color-mix(in srgb, var(--color-secondary) 18%, transparent))' }}
          />
          <div
            className="overflow-hidden rounded-2xl border shadow-2xl"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <Image
              src={resumeStudioShot}
              alt="AI Resume Builder's resume editor, showing form fields on the left and a live-updating resume preview on the right"
              priority
              placeholder="blur"
              sizes="(min-width: 1024px) 640px, 100vw"
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
