import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

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

  return (
    <div className="w-full max-w-[400px]">
      {!success ? (
        <>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold text-text-primary">Reset password</h1>
            <p className="text-sm text-text-secondary mt-1">
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                error={error}
              />

              <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full">
                {isSubmitting ? 'Sending link…' : 'Send Reset Link'}
              </Button>
            </form>
          </Card>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="group inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-[18px] mr-1 group-hover:-translate-x-1 transition-transform duration-200">
                arrow_back
              </span>
              Back to login
            </Link>
          </div>
        </>
      ) : (
        <Card className="p-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative h-16 w-16 mx-auto mb-6">
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative h-16 w-16 rounded-full flex items-center justify-center border border-primary/25 bg-primary/10">
              <span className="material-symbols-outlined text-[28px] text-primary">
                mark_email_read
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-center text-text-primary mb-2">
            Check your inbox
          </h1>
          <p className="text-sm text-center text-text-secondary mb-6">
            We've sent a password reset link to <br />
            <span className="font-semibold text-text-primary">{email}</span>
          </p>

          <div className="space-y-3">
            <Link to="/login">
              <Button type="button" variant="primary" size="lg" className="w-full">
                Return to login
              </Button>
            </Link>

            <button
              type="button"
              onClick={sendResetLink}
              disabled={cooldown > 0 || isSubmitting}
              className="w-full text-sm font-medium text-text-secondary hover:text-primary transition-colors hover:underline disabled:no-underline disabled:opacity-50 py-1"
            >
              {cooldown > 0 ? `Resend email in ${cooldown}s` : "Didn't get it? Resend email"}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
