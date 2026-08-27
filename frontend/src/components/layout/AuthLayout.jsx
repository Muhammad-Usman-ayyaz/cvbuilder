import { useEffect, useRef, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';

const PROOF_POINTS = [
  'ATS-safe formatting, checked automatically.',
  'Tailored to any job description in seconds.',
  'Every application tracked in one place.',
];

function LivingResumeCard() {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [barsIn, setBarsIn] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarsIn(true), 350);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!barsIn) return;
    const target = 96;
    const start = performance.now();
    const duration = 900;
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setScore(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [barsIn]);

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -6, y: px * 8 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const skills = ['Product Strategy', 'Figma', 'A/B Testing', 'SQL'];
  const lines = [90, 100, 72];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      className="relative w-full max-w-[340px] rounded-2xl bg-[#171B23] border border-white/10 p-5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-transform duration-200 ease-out will-change-transform animate-in fade-in zoom-in-95 duration-700 delay-150"
    >
      {/* header row */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="h-9 w-9 rounded-full bg-[#34C28D]/20 flex items-center justify-center text-[#34C28D] font-semibold text-sm">
          AM
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-2.5 w-24 rounded-full bg-white/25" />
          <div className="h-2 w-16 rounded-full bg-white/10 mt-1.5" />
        </div>
      </div>

      {/* experience lines */}
      <div className="mt-4 space-y-2.5">
        {lines.map((w, i) => (
          <div key={i} className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/25 transition-all ease-out"
              style={{
                width: barsIn ? `${w}%` : '0%',
                transitionDuration: '900ms',
                transitionDelay: `${300 + i * 120}ms`,
              }}
            />
          </div>
        ))}
      </div>

      {/* skill pills */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {skills.map((s, i) => (
          <span
            key={s}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.06] text-white/70 border border-white/10 animate-in fade-in zoom-in-95"
            style={{ animationDelay: `${500 + i * 100}ms`, animationDuration: '500ms', animationFillMode: 'backwards' }}
          >
            {s}
          </span>
        ))}
      </div>

      {/* ATS score badge */}
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[#0E1116] border border-white/10 shadow-lg flex flex-col items-center justify-center animate-in fade-in zoom-in-50 duration-500 delay-700">
        <span className="material-symbols-outlined text-[12px] text-[#34C28D] -mb-0.5">verified</span>
        <span className="text-base font-bold text-white leading-none">{score}</span>
        <span className="text-[8px] text-white/40 tracking-wide">ATS</span>
      </div>
    </div>
  );
}

export default function AuthLayout() {
  const [proofIndex, setProofIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setProofIndex((i) => (i + 1) % PROOF_POINTS.length);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden flex bg-[var(--color-bg-main)]">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between bg-[#0E1116] px-12 py-10 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#34C28D]/20 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#F0B84B]/10 blur-[110px]" />

        <Link to="/" className="relative z-10 flex items-center gap-2.5 w-fit">
          <img src="/favicon.svg" alt="" className="h-7 w-7" />
          <span className="text-white font-semibold text-lg tracking-tight">Resumify</span>
        </Link>

        <div className="relative z-10 flex flex-col gap-8">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2
              style={{ fontFamily: "'Fraunces', serif" }}
              className="text-[2.5rem] leading-[1.1] font-medium text-white max-w-sm"
            >
              Your career story, sharpened.
            </h2>
            <p className="mt-3 text-white/50 text-[15px] max-w-xs">
              Build resumes that pass the bots and impress the humans.
            </p>
          </div>
          <LivingResumeCard />
        </div>

        <div className="relative z-10">
          <p key={proofIndex} className="text-white/60 text-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
            {PROOF_POINTS[proofIndex]}
          </p>
          <div className="mt-4 flex items-center gap-1.5">
            {PROOF_POINTS.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${i === proofIndex ? 'w-6 bg-[#34C28D]' : 'w-1.5 bg-white/15'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 py-8 sm:px-10">
          <div className="w-full max-w-[420px]">
            <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 w-fit">
              <img src="/favicon.svg" alt="" className="h-7 w-7" />
              <span className="text-[var(--color-text-primary)] font-semibold text-lg tracking-tight">
                Resumify
              </span>
            </Link>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}