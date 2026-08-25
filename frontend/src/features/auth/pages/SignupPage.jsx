import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getPasswordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[0-9]/.test(pw) && /[^a-zA-Z0-9]|[A-Z]/.test(pw)) score++;
  return score; // 0-3
}

const STRENGTH_LABEL = ['Too short', 'Weak', 'Good', 'Strong'];
const STRENGTH_COLOR = ['#8a8fa8', '#f87171', '#fbbf24', '#22c55e'];

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    let newErrors = {};

    if (password !== confirmPassword) { newErrors.confirmPassword = 'Passwords do not match'; }
    if (password.length < 6) { newErrors.password = 'Password must be at least 6 characters'; }
    if (!agreedToTerms) { newErrors.terms = 'Please agree to the Terms & Conditions to continue'; }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signup({ email, password, fullName });
      if (result?.session || result?.success) {
        navigate('/dashboard');
      } else {
        navigate('/login', { state: { message: 'Account created! Check your email to confirm, then log in.' } });
      }
    } catch (err) {
      setErrors({ general: err.message || 'An error occurred during sign up.' });
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    borderColor: '#e2e4ed',
    color: '#1a2340',
    background: '#fafbff',
  };
  const onFocus = (e) => { e.target.style.borderColor = '#c86b85'; e.target.style.boxShadow = '0 0 0 3px rgba(200,107,133,0.12)'; };
  const onBlur = (e) => { e.target.style.borderColor = '#e2e4ed'; e.target.style.boxShadow = 'none'; };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0f1220] lg:bg-white">
      {/* ── Left branding panel ── */}
      <div
        className="flex flex-col justify-center lg:justify-between gap-4 lg:gap-0 w-full lg:w-[42%] shrink-0 px-6 pt-8 pb-12 lg:px-12 lg:py-12"
        style={{ background: 'linear-gradient(160deg, #1a2340 0%, #141929 60%, #0f1220 100%)' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center">
          <span className="text-white font-bold text-2xl tracking-wide">Resumify</span>
        </div>

        {/* Middle tagline */}
        <div className="text-center">
          <div className="w-16 lg:w-20 h-1 rounded-full mx-auto mb-4 lg:mb-8" style={{ background: 'linear-gradient(90deg, #c86b85, #e8a0b4)' }} />
          <h2 className="text-white text-2xl lg:text-3xl font-bold leading-tight mb-2 lg:mb-4">
            Your career journey<br />starts here.
          </h2>
          <p className="hidden lg:block text-white/50 text-sm leading-relaxed max-w-xs mx-auto">
            Join thousands of professionals who landed their dream jobs using Resumify's smart resume builder.
          </p>
        </div>

        {/* Footer dots */}
        <div className="hidden lg:flex justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span className="w-2 h-2 rounded-full bg-white/60" />
          <span className="w-2 h-2 rounded-full bg-white/20" />
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 lg:py-10 bg-white relative overflow-hidden rounded-t-[2.5rem] lg:rounded-none -mt-6 lg:mt-0 z-10 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] lg:shadow-none">
        {/* Subtle glow */}
        <div
          className="pointer-events-none absolute top-0 left-0 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f3c6d2, transparent 70%)' }}
        />

        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-4 lg:mb-6 text-center">
            <h1 className="text-2xl lg:text-3xl font-extrabold mb-1" style={{ color: '#1a2340' }}>Welcome</h1>
            <p className="text-xs lg:text-sm" style={{ color: '#8a8fa8' }}>Register now, it's free!</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 mt-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#8a8fa8' }}>
                Full Name
              </label>
              <input
                id="fullName" name="fullName" type="text" placeholder="John Doe"
                value={fullName} onChange={(e) => setFullName(e.target.value)} required
                className="w-full rounded-full border px-5 py-3 text-sm outline-none transition-all duration-200"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#8a8fa8' }}>
                Email Address
              </label>
              <input
                id="email" name="email" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full rounded-full border px-5 py-3 text-sm outline-none transition-all duration-200"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#8a8fa8' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password" name="password" type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required
                  className="w-full rounded-full border px-5 py-3 pr-12 text-sm outline-none transition-all duration-200 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#8a8fa8' }}
                  aria-label={showPassword ? 'Hide' : 'Show'}>
                  <span className="material-symbols-outlined text-[19px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 ml-2">{errors.password}</p>}
              {/* Strength text */}
              {password && !errors.password && (
                <div className="mt-1 px-2">
                  <span className="text-[11px] font-semibold" style={{ color: STRENGTH_COLOR[strength] }}>
                    {STRENGTH_LABEL[strength]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#8a8fa8' }}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword" name="confirmPassword" type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required
                  className="w-full rounded-full border px-5 py-3 pr-12 text-sm outline-none transition-all duration-200 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#8a8fa8' }}
                  aria-label={showConfirm ? 'Hide' : 'Show'}>
                  <span className="material-symbols-outlined text-[19px]">{showConfirm ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-2">{errors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <div className="pt-0.5">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#c86b85]" />
                <span className="text-[12.5px] leading-snug" style={{ color: '#8a8fa8' }}>
                  I agree to the{' '}
                  <Link to="/terms" className="font-semibold hover:opacity-80" style={{ color: '#c86b85' }}>Terms &amp; Conditions</Link>
                  {' '}and{' '}
                  <Link to="/terms#privacy" className="font-semibold hover:opacity-80" style={{ color: '#c86b85' }}>Privacy Policy</Link>.
                </span>
              </label>
              {errors.terms && <p className="text-red-500 text-xs mt-1 ml-2">{errors.terms}</p>}
            </div>

            {/* General Error */}
            {errors.general && <p className="text-red-500 text-sm text-center font-medium pt-1">{errors.general}</p>}

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit" disabled={isSubmitting}
                className="w-full rounded-full py-3 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #c86b85 0%, #a0415c 100%)' }}
              >
                {isSubmitting ? 'Creating account…' : 'Get Started'}
              </button>
            </div>
          </form>

          {/* Footer link */}
          <p className="text-center mt-5 text-sm" style={{ color: '#8a8fa8' }}>
            Already a member?{' '}
            <Link to="/login" className="font-semibold transition-colors hover:opacity-80" style={{ color: '#c86b85' }}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}