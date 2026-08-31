import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import ErrorMessage from '../../../components/common/ErrorMessage';

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
    <div className="w-full max-w-[400px]">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold text-text-primary">Welcome back</h1>
        <p className="text-sm text-text-secondary mt-1">Sign in to continue building your resume.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            labelRight={
              <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </Link>
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

          {error && <ErrorMessage message={error} />}

          <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full">
            {isSubmitting ? 'Signing in…' : 'Login'}
          </Button>
        </form>
      </Card>

      <p className="text-center mt-6 text-sm text-text-secondary">
        Don't have an account?{' '}
        <Link to="/signup" className="font-semibold text-primary hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
