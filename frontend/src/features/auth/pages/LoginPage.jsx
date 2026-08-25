import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0f1220] lg:bg-white">
      {/* ── Left branding panel ── */}
      <div
        className="flex flex-col justify-center lg:justify-between gap-4 lg:gap-0 w-full lg:w-[42%] shrink-0 px-6 pt-8 pb-12 lg:px-12 lg:py-12"
        style={{
          background: 'linear-gradient(160deg, #1a2340 0%, #141929 60%, #0f1220 100%)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center">
          <span className="text-white font-bold text-2xl tracking-wide">Resumify</span>
        </div>

        {/* Middle tagline */}
        <div className="text-center">
          <div
            className="w-16 lg:w-20 h-1 rounded-full mx-auto mb-4 lg:mb-8"
            style={{ background: 'linear-gradient(90deg, #c86b85, #e8a0b4)' }}
          />
          <h2 className="text-white text-2xl lg:text-3xl font-bold leading-tight mb-2 lg:mb-4">
            Build resumes that<br />get you hired.
          </h2>
          <p className="hidden lg:block text-white/50 text-sm leading-relaxed max-w-xs mx-auto">
            Craft beautiful, ATS-optimized resumes in minutes with our intelligent editor and professional templates.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="hidden lg:inline-block mt-8 px-7 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #c86b85, #a0415c)', color: '#fff' }}
          >
            Get Started Free
          </button>
        </div>

        {/* Footer dots */}
        <div className="hidden lg:flex justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white/60" />
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span className="w-2 h-2 rounded-full bg-white/20" />
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 lg:py-12 bg-white relative overflow-hidden rounded-t-[2.5rem] lg:rounded-none -mt-6 lg:mt-0 z-10 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] lg:shadow-none">
        {/* Subtle glow */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-72 h-72 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f3c6d2, transparent 70%)' }}
        />

        <div className="w-full max-w-[400px]">
          {/* Header */}
          <div className="mb-6 lg:mb-8 text-center">
            <h1 className="text-2xl lg:text-3xl font-extrabold mb-1" style={{ color: '#1a2340' }}>
              Welcome Back!
            </h1>
            <p className="text-xs lg:text-sm" style={{ color: '#8a8fa8' }}>Sign in to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: '#8a8fa8' }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-full border px-5 py-3 text-sm outline-none transition-all duration-200"
                style={{
                  borderColor: '#e2e4ed',
                  color: '#1a2340',
                  background: '#fafbff',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#c86b85'; e.target.style.boxShadow = '0 0 0 3px rgba(200,107,133,0.12)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e4ed'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold tracking-wide uppercase" style={{ color: '#8a8fa8' }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium transition-colors hover:opacity-80"
                  style={{ color: '#c86b85' }}
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-full border px-5 py-3 pr-12 text-sm outline-none transition-all duration-200 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                  style={{
                    borderColor: '#e2e4ed',
                    color: '#1a2340',
                    background: '#fafbff',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#c86b85'; e.target.style.boxShadow = '0 0 0 3px rgba(200,107,133,0.12)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e4ed'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#8a8fa8' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[19px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && <p className="text-red-500 text-sm text-center font-medium pt-1">{error}</p>}

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full py-3 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #c86b85 0%, #a0415c 100%)' }}
              >
                {isSubmitting ? 'Signing in…' : 'Login'}
              </button>
            </div>
          </form>

          {/* Footer link */}
          <p className="text-center mt-6 text-sm" style={{ color: '#8a8fa8' }}>
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold transition-colors hover:opacity-80"
              style={{ color: '#c86b85' }}
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}