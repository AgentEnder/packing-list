import { useEffect } from 'react';
import { useAuth, LoginForm } from '@packing-list/shared-components';
import { Link } from '../../components/Link';

export default function LoginPage() {
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to home if already logged in
    if (user) {
      window.location.href = '/';
    }
  }, [user]);

  // Don't render anything if user is already logged in (during redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md shadow-2xl bg-base-100">
        <div className="card-body">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-base-content/70 mt-2">
              Sign in to access your packing lists
            </p>
          </div>

          <LoginForm />

          <div className="divider">OR</div>

          <div className="text-center">
            <Link href="/" className="link link-primary">
              Continue as Guest
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
