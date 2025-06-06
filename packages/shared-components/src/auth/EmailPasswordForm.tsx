import { useState } from 'react';
import { useAuth } from './useAuth.js';
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft } from 'lucide-react';

interface EmailPasswordFormProps {
  mode: 'signin' | 'signup';
  onModeToggle: () => void;
  onBack: () => void;
  onSuccess?: () => void;
}

export function EmailPasswordForm({
  mode,
  onModeToggle,
  onBack,
  onSuccess,
}: EmailPasswordFormProps) {
  const { signInWithPassword, signUp, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (localError) setLocalError(null);
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setLocalError('Email is required');
      return false;
    }

    if (!formData.email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return false;
    }

    if (!formData.password.trim()) {
      setLocalError('Password is required');
      return false;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }

    if (mode === 'signup') {
      if (!formData.name.trim()) {
        setLocalError('Name is required for signup');
        return false;
      }

      if (!formData.confirmPassword.trim()) {
        setLocalError('Please confirm your password');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setLocalError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'signup') {
        const result = await signUp(formData.email, formData.password, {
          name: formData.name,
        });

        // Check if the thunk was rejected
        if (result.type.endsWith('/rejected')) {
          const errorMessage = (result.payload as string) || 'Signup failed';
          setLocalError(errorMessage);
          return;
        }

        console.log('Email signup successful');
        onSuccess?.();
      } else {
        const result = await signInWithPassword(
          formData.email,
          formData.password
        );

        // Check if the thunk was rejected
        if (result.type.endsWith('/rejected')) {
          const errorMessage = (result.payload as string) || 'Signin failed';
          setLocalError(errorMessage);
          return;
        }

        console.log('Email signin successful');
        onSuccess?.();
      }
    } catch (error) {
      console.error(`Email ${mode} error:`, error);
      setLocalError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const displayError = localError || error;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="text-xl font-semibold text-base-content">
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h3>
          <p className="text-sm text-base-content/60 mt-1">
            {mode === 'signup'
              ? 'Enter your details to get started'
              : 'Enter your credentials to continue'}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {displayError && (
        <div className="alert alert-error">
          <span className="text-sm">{displayError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name field for signup */}
        {mode === 'signup' && (
          <div className="form-control">
            <label className="label pb-1">
              <span className="label-text font-medium">Full Name</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input input-bordered w-full pl-10 h-12"
                placeholder="Enter your full name"
                disabled={loading}
                required
              />
            </div>
          </div>
        )}

        {/* Email field */}
        <div className="form-control">
          <label className="label pb-1">
            <span className="label-text font-medium">Email Address</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input input-bordered w-full pl-10 h-12"
              placeholder="Enter your email address"
              disabled={loading}
              required
            />
          </div>
        </div>

        {/* Password field */}
        <div className="form-control">
          <label className="label pb-1">
            <span className="label-text font-medium">Password</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="input input-bordered w-full pl-10 pr-12 h-12"
              placeholder="Enter your password"
              disabled={loading}
              required
              minLength={6}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {mode === 'signup' && (
            <label className="label pt-1">
              <span className="label-text-alt text-base-content/50 text-xs">
                Minimum 6 characters required
              </span>
            </label>
          )}
        </div>

        {/* Confirm Password field for signup */}
        {mode === 'signup' && (
          <div className="form-control">
            <label className="label pb-1">
              <span className="label-text font-medium">Confirm Password</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="input input-bordered w-full pl-10 pr-12 h-12"
                placeholder="Enter your password again"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className={`btn btn-primary w-full h-12 text-base ${
            loading ? 'loading' : ''
          }`}
          disabled={loading}
        >
          {loading
            ? `${mode === 'signup' ? 'Creating Account...' : 'Signing In...'}`
            : `${mode === 'signup' ? 'Create Account' : 'Sign In'}`}
        </button>
      </form>

      {/* Support Disclaimer */}
      <div className="alert alert-warning bg-warning/10 border-warning/20">
        <div className="text-sm text-warning-content">
          <strong>Note:</strong> We recommend using{' '}
          <button
            type="button"
            className="link link-primary font-medium"
            onClick={onBack}
          >
            Google sign-in
          </button>{' '}
          for the best experience. Email/password authentication has limited
          support and may not receive dedicated assistance for technical issues.
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="text-center">
        <p className="text-sm text-base-content/60">
          {mode === 'signup'
            ? 'Already have an account?'
            : "Don't have an account?"}{' '}
          <button
            type="button"
            className="link link-primary font-medium hover:no-underline"
            onClick={onModeToggle}
            disabled={loading}
          >
            {mode === 'signup' ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>

      {/* Email confirmation note for signup */}
      {mode === 'signup' && (
        <div className="alert alert-info bg-info/10 border-info/20">
          <div className="text-sm text-info-content">
            <strong>Email Verification:</strong> You may need to verify your
            email before you can sign in.
          </div>
        </div>
      )}
    </div>
  );
}
