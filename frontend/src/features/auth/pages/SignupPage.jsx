import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import ErrorMessage from '../../../components/common/ErrorMessage';

function getPasswordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[0-9]/.test(pw) && /[^a-zA-Z0-9]|[A-Z]/.test(pw)) score++;
  return score; // 0-3
}

const STRENGTH_LABEL = ['Too short', 'Weak', 'Good', 'Strong'];
const STRENGTH_CLASS = ['text-text-secondary', 'text-error', 'text-warning', 'text-success'];

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

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold text-text-primary">Create your account</h1>
        <p className="text-sm text-text-secondary mt-1">Register now, it's free!</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="fullName"
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoFocus
          />

          <Input
            id="email"
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            error={errors.password}
            helpText={
              password && !errors.password ? (
                <span className={`font-semibold ${STRENGTH_CLASS[strength]}`}>{STRENGTH_LABEL[strength]}</span>
              ) : undefined
            }
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-text-secondary hover:text-text-primary transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[19px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            }
          />

          <Input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            error={errors.confirmPassword}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="text-text-secondary hover:text-text-primary transition-colors"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[19px]">
                  {showConfirm ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            }
          />

          <div>
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
              />
              <span className="text-xs leading-snug text-text-secondary">
                I agree to the{' '}
                <Link to="/terms" className="font-semibold text-primary hover:underline">Terms &amp; Conditions</Link>
                {' '}and{' '}
                <Link to="/terms#privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>.
              </span>
            </label>
            {errors.terms && <p className="text-error text-xs mt-1 ml-2">{errors.terms}</p>}
          </div>

          {errors.general && <ErrorMessage message={errors.general} />}

          <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating account…' : 'Get Started'}
          </Button>
        </form>
      </Card>

      <p className="text-center mt-6 text-sm text-text-secondary">
        Already a member?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
