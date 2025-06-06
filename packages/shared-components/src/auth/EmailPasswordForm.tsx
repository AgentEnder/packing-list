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
    name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
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

    if (mode === 'signup' && !formData.name.trim()) {
      setLocalError('Name is required for signup');
      return false;
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="text-lg font-medium text-base-content">
            {mode === 'signup' ? 'Create Account' : 'Sign In'} with Email
          </h3>
          <p className="text-sm text-base-content/70">
            {mode === 'signup'
              ? 'Create an account to sync across devices'
              : 'Sign in with your email and password'}
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name field for signup */}
        {mode === 'signup' && (
          <div className="form-control">
            <label className="label">
              <span className="label-text">Full Name</span>
            </label>
            <div className="input-group">
              <span className="bg-base-200">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="Enter your full name"
                disabled={loading}
                required
              />
            </div>
          </div>
        )}

        {/* Email field */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Email</span>
          </label>
          <div className="input-group">
            <span className="bg-base-200">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input input-bordered w-full"
              placeholder="Enter your email"
              disabled={loading}
              required
            />
          </div>
        </div>

        {/* Password field */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Password</span>
          </label>
          <div className="input-group">
            <span className="bg-base-200">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="input input-bordered w-full"
              placeholder="Enter your password"
              disabled={loading}
              required
              minLength={6}
            />
            <button
              type="button"
              className="btn btn-ghost btn-square"
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
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                Minimum 6 characters
              </span>
            </label>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading
            ? `${mode === 'signup' ? 'Creating Account...' : 'Signing In...'}`
            : `${mode === 'signup' ? 'Create Account' : 'Sign In'}`}
        </button>
      </form>

      {/* Mode Toggle */}
      <div className="text-center">
        <p className="text-sm text-base-content/70">
          {mode === 'signup'
            ? 'Already have an account?'
            : "Don't have an account?"}{' '}
          <button
            type="button"
            className="link link-primary text-sm font-medium"
            onClick={onModeToggle}
            disabled={loading}
          >
            {mode === 'signup' ? 'Sign in instead' : 'Create one here'}
          </button>
        </p>
      </div>

      {/* Email confirmation note for signup */}
      {mode === 'signup' && (
        <div className="alert alert-info">
          <div className="text-sm">
            <strong>Note:</strong> You may need to check your email and click a
            confirmation link before you can sign in.
          </div>
        </div>
      )}
    </div>
  );
}
