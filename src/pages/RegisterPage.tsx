import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, verifyOtp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [formError, setFormError] = useState('');  const [otpError, setOtpError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    setFormError('');
    setIsLoading(true);

    try {
      const { error } = await signUp(formData.email, formData.password);
      if (error) throw error;
      toast.success('Verification code sent to your email!');
      setStep('otp');
    } catch (error: any) {
      console.error('Error signing up:', error);
      setFormError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setOtpError('');
    try {
      const { error } = await verifyOtp(formData.email, otp, 'signup');
      if (error) throw error;
      toast.success('Account verified successfully!');
      navigate('/projects');
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setOtpError(error.message || 'Invalid or expired code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (formError) setFormError('');
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (step === 'otp') {
    return (
      <div className="container max-w-md mx-auto py-16">
        <Card className="shadow-sm border border-gray-200">
          <CardHeader className="space-y-1 pb-4">
            <h2 className="text-2xl font-semibold text-center text-[#232323]">Verify your email</h2>
            <p className="text-sm text-center text-[#505050]">
              We've sent a 6-digit code to <span className="font-semibold text-[#232323]">{formData.email}</span>.<br />
              Enter it below to activate your account.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="otp" className="text-sm font-medium text-[#232323]">
                  Verification Code
                </label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => { setOtpError(''); setOtp(e.target.value.replace(/\D/g, '')); }}
                  required
                  disabled={isLoading}
                  className={`text-center tracking-widest text-lg ${otpError ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
                />
                {otpError && <p className="text-xs text-red-500 mt-1">{otpError}</p>}
              </div>
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="relative w-full overflow-hidden rounded-md px-4 py-2 text-sm font-semibold text-white bg-indigo-600 transition-all duration-300 group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-indigo-700 transition-transform duration-300 ease-in-out group-hover:translate-x-0" />
                <span className="relative">{isLoading ? 'Verifying...' : 'Verify & Complete Sign Up'}</span>
              </button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col pb-6">
            <p className="text-sm text-center text-[#505050]">
              <button
                type="button"
                onClick={() => { setStep('details'); setOtp(''); setOtpError(''); }}
                className="font-medium underline-offset-4 hover:underline text-indigo-600"
              >
                ← Go back
              </button>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-16">
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="space-y-1 pb-4">
          <h2 className="text-2xl font-semibold text-center text-[#232323]">Create an account</h2>
          <p className="text-sm text-center text-[#505050]">
            Enter your details to create your account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[#232323]">
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
              <label htmlFor="password" className="text-sm font-medium text-[#232323]">
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
                  minLength={6}
                  className="pr-10"
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
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-[#232323]">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className={`pr-10 ${formError ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formError && <p className="text-xs text-red-500 mt-1">{formError}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full overflow-hidden rounded-md px-4 py-2 text-sm font-semibold text-white bg-indigo-600 transition-all duration-300 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 translate-x-[-100%] bg-indigo-700 transition-transform duration-300 ease-in-out group-hover:translate-x-0" />
              <span className="relative">{isLoading ? 'Creating account...' : 'Create Account'}</span>
            </button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col pt-0 pb-6">
          <p className="text-sm text-center text-[#505050]">
            Already have an account?{' '}
            <Link to="/login" className="font-medium underline-offset-4 hover:underline text-indigo-600">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 