import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const RESEND_COOLDOWN = 30;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const sendResetLink = async () => {
    setError(null);
    setIsSubmitting(true);

    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    setSuccess(true);
    setCooldown(RESEND_COOLDOWN);
    setIsSubmitting(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendResetLink();
  };

  const inputStyle = {
    borderColor: '#e2e4ed',
    color: '#1a2340',
    background: '#fafbff',
  };
  const onFocus = (e) => { e.target.style.borderColor = '#c86b85'; e.target.style.boxShadow = '0 0 0 3px rgba(200,107,133,0.12)'; };
  const onBlur = (e) => { e.target.style.borderColor = '#e2e4ed'; e.target.style.boxShadow = 'none'; };

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
            Get back to<br />building your future.
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto">
            It happens to the best of us. Reset your password and jump right back into your resume.
          </p>
        </div>

        {/* Footer dots */}
        <div className="flex justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span className="w-2 h-2 rounded-full bg-white/60" />
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-white relative overflow-hidden">
        {/* Subtle glow */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-72 h-72 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f3c6d2, transparent 70%)' }}
        />

        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-8">
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

        <div className="w-full max-w-[400px]">
          {!success ? (
            <>
              {/* Header */}
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold mb-2" style={{ color: '#1a2340' }}>Reset Password</h1>
                <p className="text-sm px-2" style={{ color: '#8a8fa8' }}>
                  Enter the email address associated with your account and we'll send you a link to reset your password.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#8a8fa8' }}>
                    Email Address
                  </label>
                  <input
                    id="email" name="email" type="email" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
                    className="w-full rounded-full border px-5 py-3 text-sm outline-none transition-all duration-200"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                  {error && <p className="text-red-500 text-xs mt-1.5 ml-2">{error}</p>}
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit" disabled={isSubmitting}
                    className="w-full rounded-full py-3 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #c86b85 0%, #a0415c 100%)' }}
                  >
                    {isSubmitting ? 'Sending link…' : 'Send Reset Link'}
                  </button>
                </div>
              </form>

              {/* Footer link */}
              <div className="mt-8 text-center">
                <Link
                  to="/login"
                  className="group inline-flex items-center text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: '#c86b85' }}
                >
                  <span className="material-symbols-outlined text-[18px] mr-1 group-hover:-translate-x-1 transition-transform duration-200">
                    arrow_back
                  </span>
                  Back to login
                </Link>
              </div>
            </>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="relative h-16 w-16 mx-auto mb-6">
                <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(200,107,133,0.2)' }} />
                <div
                  className="relative h-16 w-16 rounded-full flex items-center justify-center border"
                  style={{ background: 'rgba(200,107,133,0.1)', borderColor: 'rgba(200,107,133,0.25)' }}
                >
                  <span className="material-symbols-outlined text-[28px]" style={{ color: '#c86b85' }}>
                    mark_email_read
                  </span>
                </div>
              </div>

              <h1 className="text-3xl font-extrabold text-center mb-2" style={{ color: '#1a2340' }}>
                Check your inbox
              </h1>
              <p className="text-sm text-center mb-8" style={{ color: '#8a8fa8' }}>
                We've sent a password reset link to <br/>
                <span className="font-semibold" style={{ color: '#1a2340' }}>{email}</span>
              </p>

              <div className="space-y-4">
                <Link to="/login">
                  <button
                    type="button"
                    className="w-full rounded-full py-3 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #c86b85 0%, #a0415c 100%)' }}
                  >
                    Return to login
                  </button>
                </Link>

                <button
                  type="button"
                  onClick={sendResetLink}
                  disabled={cooldown > 0 || isSubmitting}
                  className="w-full text-sm font-medium transition-colors hover:underline disabled:no-underline disabled:opacity-50 py-1"
                  style={{ color: '#1a2340' }}
                >
                  {cooldown > 0 ? `Resend email in ${cooldown}s` : "Didn't get it? Resend email"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}