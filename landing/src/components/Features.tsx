import Image from 'next/image';
import atsResultsShot from '../../public/screenshots/ats-results.png';

const FEATURES = [
  {
    title: 'Live-preview resume builder',
    description:
      'Fill in your details across Personal, Education, Experience, Projects, and Skills — watch your resume render in real time as you type, no separate "preview" step.',
    icon: (
      <path d="M4 4h16v16H4z M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    ),
  },
  {
    title: 'Multiple templates & accent colors',
    description:
      'Switch between resume templates and accent colors without losing your content — pick the look that fits the role you’re applying for.',
    icon: (
      <path d="M4 6h6v6H4zM14 6h6v6h-6zM4 16h6v2H4zM14 16h6v2h-6z" stroke="currentColor" strokeWidth="1.6" fill="none" />
    ),
  },
  {
    title: 'AI-powered ATS Checker',
    description:
      'Paste a job description and get a real AI-scored breakdown: overall ATS score, exactly which keywords matched or are missing, and formatting checks recruiters’ ATS software looks for.',
    icon: (
      <path d="M9 12l2 2 4-4M4 4h16v16H4z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: 'Speech-to-text dictation',
    description:
      'Dictate your professional summary and experience bullet points out loud instead of typing — built into the editor, no extra app needed.',
    icon: (
      <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3zM6 11a6 6 0 0012 0M12 19v3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    ),
  },
  {
    title: 'Fix in Studio, right from your results',
    description:
      'See a missing keyword or a failed formatting check? Jump straight from your ATS report into the exact editor section that needs it.',
    icon: (
      <path d="M12 3l1.8 5.6L19 10l-5.2 1.4L12 17l-1.8-5.6L5 10l5.2-1.4L12 3z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
    ),
  },
  {
    title: 'One-click PDF export',
    description:
      'Export a clean, ATS-friendly vector PDF the moment you’re ready to apply — no watermarks, no paywall to download.',
    icon: (
      <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
          Everything you need to land the interview
        </h2>
        <p className="mt-4 text-lg text-[var(--color-text-secondary)]">
          Built as one connected workflow — write your resume, check it against a real job posting,
          and fix what&apos;s missing without switching tools.
        </p>
      </div>

      <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <li
            key={feature.title}
            className="rounded-2xl border p-6"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--color-soft-primary)', color: 'var(--color-primary)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                {feature.icon}
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-[var(--color-text-primary)]">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {feature.description}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-20 grid items-center gap-10 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <h3 className="text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
            Know exactly why your resume was rejected — before a recruiter ever sees it
          </h3>
          <p className="mt-4 leading-relaxed text-[var(--color-text-secondary)]">
            Most ATS checkers give you a vague number. This one shows its work: an overall score, a
            keyword-match score, the specific matched and missing keywords from the job description,
            and a formatting checklist covering the structural things ATS software actually looks for
            — contact info, dated experience, quantified achievements, and more.
          </p>
        </div>
        <div className="order-1 overflow-hidden rounded-2xl border shadow-xl lg:order-2" style={{ borderColor: 'var(--color-border)' }}>
          <Image
            src={atsResultsShot}
            alt="AI Resume Builder's ATS Checker results screen, showing an overall score, keyword match score, matched and missing keywords, and formatting checks"
            placeholder="blur"
            sizes="(min-width: 1024px) 640px, 100vw"
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
