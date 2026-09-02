import { SIGNUP_URL } from '@/lib/site';

export default function CtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div
        className="overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-16"
        style={{ background: 'linear-gradient(135deg, #1A365D 0%, #0F172A 60%, #0B1220 100%)' }}
      >
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Stop guessing why your resume isn&apos;t landing interviews.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
          Build it, score it against the job, fix what&apos;s missing. Free to start.
        </p>
        <div className="mt-8">
          <a
            href={SIGNUP_URL}
            className="inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-base font-semibold shadow-md transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--color-secondary)', color: '#0F172A' }}
          >
            Create your free resume
          </a>
        </div>
      </div>
    </section>
  );
}
