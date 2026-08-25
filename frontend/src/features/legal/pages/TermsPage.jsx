import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function TermsPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash === '#privacy') {
      const element = document.getElementById('privacy');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [hash]);

  return (
    <div className="min-h-screen w-full flex">
      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[42%] shrink-0 px-12 py-12"
        style={{ background: 'linear-gradient(160deg, #1a2340 0%, #141929 60%, #0f1220 100%)' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-3 ring-1 ring-white/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#c86b85" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke="#c86b85" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-wide">Resumify</span>
        </div>

        {/* Middle tagline */}
        <div className="text-center">
          <div className="w-20 h-1 rounded-full mx-auto mb-8" style={{ background: 'linear-gradient(90deg, #c86b85, #e8a0b4)' }} />
          <h2 className="text-white text-3xl font-bold leading-tight mb-4">
            Trust and <br />Transparency.
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto">
            We are committed to providing a secure and reliable platform for your career growth.
          </p>
        </div>

        {/* Footer dots */}
        <div className="flex justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span className="w-2 h-2 rounded-full bg-white/60" />
          <span className="w-2 h-2 rounded-full bg-white/20" />
        </div>
      </div>

      {/* ── Right content panel ── */}
      <div className="flex-1 flex flex-col px-8 py-10 lg:px-16 bg-white relative overflow-y-auto max-h-screen">
        {/* Subtle glow */}
        <div
          className="pointer-events-none fixed top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f3c6d2, transparent 70%)' }}
        />

        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-6 z-10">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2"
            style={{ background: 'linear-gradient(135deg, #1a2340, #0f1220)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#c86b85" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke="#c86b85" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-lg" style={{ color: '#1a2340' }}>Resumify</span>
        </div>

        <div className="w-full max-w-3xl mx-auto z-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-10 pb-6 border-b" style={{ borderColor: '#e2e4ed' }}>
            <Link to="/signup" className="flex items-center transition-colors hover:opacity-80" style={{ color: '#8a8fa8' }}>
              <span className="material-symbols-outlined text-[20px] mr-1">arrow_back</span>
              <span className="text-sm font-semibold">Back</span>
            </Link>
            <div className="h-6 w-[1px]" style={{ background: '#e2e4ed' }} />
            <h1 className="text-3xl font-extrabold" style={{ color: '#1a2340' }}>Legal & Policies</h1>
          </div>

          {/* Content */}
          <div className="prose prose-sm md:prose-base max-w-none text-[#5B6B62]">
            <h2 className="font-bold text-2xl mb-4" id="terms" style={{ color: '#1a2340' }}>Terms & Conditions</h2>
            <p className="mb-4">
              Welcome to <strong style={{ color: '#1a2340' }}>Resumify</strong>. By accessing and using our website and services, you agree to comply with and be bound by the following terms and conditions.
            </p>
            <ul className="list-disc pl-5 mb-8 space-y-2">
              <li><strong style={{ color: '#1a2340' }}>Usage:</strong> You agree to use the service only for lawful purposes and in a way that does not infringe the rights of others.</li>
              <li><strong style={{ color: '#1a2340' }}>Accounts:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</li>
              <li><strong style={{ color: '#1a2340' }}>Content:</strong> Any resumes, text, or data you provide remain your property. However, we reserve the right to suspend accounts that upload malicious or inappropriate content.</li>
              <li><strong style={{ color: '#1a2340' }}>Modifications:</strong> We reserve the right to modify or discontinue the service at any time without notice.</li>
            </ul>

            <div className="w-full h-[1px] my-12" style={{ background: '#e2e4ed' }} />

            <h2 className="font-bold text-2xl mb-4" id="privacy" style={{ color: '#1a2340' }}>Privacy Policy</h2>
            <p className="mb-4">
              At <strong style={{ color: '#1a2340' }}>Resumify</strong>, we take your privacy seriously. This policy outlines how we collect, use, and protect your personal information.
            </p>
            <ul className="list-disc pl-5 mb-8 space-y-2">
              <li><strong style={{ color: '#1a2340' }}>Information Collection:</strong> We collect information you provide directly, such as your name, email address, and resume content.</li>
              <li><strong style={{ color: '#1a2340' }}>How We Use It:</strong> We use this information solely to provide, maintain, and improve our resume building services.</li>
              <li><strong style={{ color: '#1a2340' }}>Data Security:</strong> We implement standard industry security measures to protect your personal data from unauthorized access or disclosure.</li>
              <li><strong style={{ color: '#1a2340' }}>Third Parties:</strong> We do not sell your personal data to third parties. We may use trusted third-party services (like analytics) who are bound by confidentiality agreements.</li>
            </ul>

            <p className="text-sm mt-12 border-t pt-6" style={{ color: '#8a8fa8', borderColor: '#e2e4ed' }}>
              Last updated: August 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
