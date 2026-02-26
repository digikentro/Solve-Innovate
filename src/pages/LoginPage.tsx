import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        if (
          error.message?.toLowerCase().includes('email not confirmed') ||
          (error.status === 400 && error.message?.toLowerCase().includes('email'))
        ) {
          setFormError('Please confirm your email before signing in.');
        } else if (error.message?.toLowerCase().includes('invalid login credentials')) {
          setFormError('Incorrect email or password.');
        } else {
          setFormError(error.message || 'Failed to sign in. Please check your credentials.');
        }
        return;
      }
      navigate('/projects');
    } catch (err) {
      console.error('Error signing in:', err);
      setFormError('Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (formError) setFormError('');
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container max-w-md mx-auto py-16">
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="space-y-1 pb-4">
          <h2 className="text-2xl font-semibold text-center text-[#232323]">
            Welcome back
          </h2>
          <p className="text-sm text-center text-[#505050]">
            Enter your credentials to sign in to your account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-[#232323]"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[#232323]"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className={`pr-10 ${formError ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Inline error */}
              {formError && (
                <p className="text-xs text-red-500 mt-1">{formError}</p>
              )}

              {/* Forgot password */}
              <div className="pt-0.5">
                <Link
                  to="/forgot-password"
                  className="text-xs hover:underline underline-offset-4 text-[#505050]"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* CTA Button — sliding shimmer on hover (jakobhoeg style) */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full overflow-hidden rounded-md px-4 py-2 text-sm font-semibold text-white bg-indigo-600 transition-all duration-300 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 translate-x-[-100%] bg-indigo-700 transition-transform duration-300 ease-in-out group-hover:translate-x-0" />
              <span className="relative">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </span>
            </button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col pt-0 pb-6">
          <p className="text-sm text-center text-[#505050]">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium underline-offset-4 hover:underline text-indigo-600"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 