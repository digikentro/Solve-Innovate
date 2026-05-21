import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setSent(true);
    } catch (error: any) {
      setFormError(error.message || 'Failed to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="container max-w-md mx-auto py-16">
        <Card className="shadow-sm border border-gray-200">
          <CardHeader className="space-y-1 pb-4">
            <h2 className="text-2xl font-semibold text-center text-[#232323]">Check your email</h2>
            <p className="text-sm text-center text-[#505050]">
              We've sent a password reset link to{' '}
              <span className="font-semibold text-[#232323]">{email}</span>.<br />
              Click the link in the email to set a new password.
            </p>
          </CardHeader>
          <CardFooter className="pb-6">
            <Link to="/login" className="w-full">
              <button
                type="button"
                className="relative w-full overflow-hidden rounded-md px-4 py-2 text-sm font-semibold text-white bg-indigo-600 transition-all duration-300 group"
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-indigo-700 transition-transform duration-300 ease-in-out group-hover:translate-x-0" />
                <span className="relative">Back to Sign In</span>
              </button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-16">
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="space-y-1 pb-4">
          <h2 className="text-2xl font-semibold text-center text-[#232323]">Forgot password</h2>
          <p className="text-sm text-center text-[#505050]">
            Enter your email and we’ll send you a reset link
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[#232323]">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => { setFormError(''); setEmail(e.target.value); }}
                required
                disabled={isLoading}
                className={formError ? 'border-red-500 focus-visible:ring-red-400' : ''}
              />
              {formError && <p className="text-xs text-red-500 mt-1">{formError}</p>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full overflow-hidden rounded-md px-4 py-2 text-sm font-semibold text-white bg-indigo-600 transition-all duration-300 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 translate-x-[-100%] bg-indigo-700 transition-transform duration-300 ease-in-out group-hover:translate-x-0" />
              <span className="relative">{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
            </button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <p className="text-sm text-center text-[#505050]">
            <Link to="/login" className="font-medium underline-offset-4 hover:underline text-indigo-600">
              ← Back to Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
