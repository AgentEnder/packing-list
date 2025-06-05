import { useState } from 'react';
import { User, Lock, Mail, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from './useAuth.js';

interface LocalAccountFormProps {
  mode?: 'signin' | 'signup';
  onSuccess?: () => void;
  onToggleMode?: () => void;
}

export function LocalAccountForm({
  mode = 'signin',
  onSuccess,
  onToggleMode,
}: LocalAccountFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn, signUp, isOfflineMode } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const result = await signUp(formData.email, formData.password, {
          name: formData.name || undefined,
        });
        if (result.error) {
          setError(result.error as string);
        } else {
          onSuccess?.();
        }
      } else {
        const result = await signIn(formData.email, formData.password);
        if (result.error) {
          setError(result.error as string);
        } else {
          onSuccess?.();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) setError(null);
    };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Offline mode indicator */}
      {isOfflineMode && (
        <div className="alert alert-info mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Offline Mode - Local Account</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name field for signup */}
        {mode === 'signup' && (
          <div className="form-control">
            <label className="label">
              <span className="label-text">Name (optional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Your name"
                className="input input-bordered w-full pl-10"
                value={formData.name}
                onChange={handleChange('name')}
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content/40" />
            </div>
          </div>
        )}

        {/* Email field */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Email</span>
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="your@email.com"
              className="input input-bordered w-full pl-10"
              value={formData.email}
              onChange={handleChange('email')}
              required
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content/40" />
          </div>
        </div>

        {/* Password field */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Password</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="input input-bordered w-full pl-10 pr-10"
              value={formData.password}
              onChange={handleChange('password')}
              required
              minLength={6}
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content/40" />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-base-content/40" />
              ) : (
                <Eye className="h-4 w-4 text-base-content/40" />
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

        {/* Error message */}
        {error && (
          <div className="alert alert-error">
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <>
              {mode === 'signup' ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Local Account
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  Sign In
                </>
              )}
            </>
          )}
        </button>

        {/* Mode toggle */}
        {onToggleMode && (
          <div className="text-center">
            <button
              type="button"
              className="link link-primary text-sm"
              onClick={onToggleMode}
            >
              {mode === 'signup'
                ? 'Already have a local account? Sign in'
                : 'Need a local account? Create one'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
