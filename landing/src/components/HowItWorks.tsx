const STEPS = [
  {
    number: '1',
    title: 'Build your resume',
    description: 'Pick a template and fill in your details — or dictate them — with a live preview the whole time.',
  },
  {
    number: '2',
    title: 'Paste a job description',
    description: 'Run it through the ATS Checker to see your real match score against that specific posting.',
  },
  {
    number: '3',
    title: 'Fix what’s missing',
    description: 'Jump straight from a flagged keyword or formatting issue into the exact editor section to fix it.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20" style={{ backgroundColor: 'var(--color-soft-primary)' }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            From blank page to submitted application
          </h2>
        </div>

        <ol className="mt-14 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.number} className="text-center sm:text-left">
              <div
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold text-white sm:mx-0"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {step.number}
              </div>
              <h3 className="mt-4 text-lg font-bold text-[var(--color-text-primary)]">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
