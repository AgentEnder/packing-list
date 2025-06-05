# Authentication with Supabase

This document outlines the implementation of user authentication using Supabase in the packing list application.

## Overview

The authentication system provides:

- Google OAuth authentication via popup window
- Session management
- Protected routes
- User profile management

**Note:** The application uses Google OAuth as the primary authentication method. Users can sign in with their Google account through a secure popup window.

## Architecture

### Packages

1. **`@packing-list/auth`** - Core authentication service
2. **`@packing-list/shared-components`** - React components and hooks

### Core Components

#### Auth Service (`packages/auth/src/auth-service.ts`)

- Singleton service managing authentication state
- Handles login, logout, signup, and session management
- Provides reactive state updates via subscription pattern

#### React Hook (`packages/shared-components/src/auth/useAuth.ts`)

- React hook for accessing authentication state
- Provides methods for authentication actions
- Automatically subscribes to auth state changes

#### UI Components

- **LoginForm** - Email/password and Google OAuth login
- **UserProfile** - User avatar and profile dropdown
- **AuthGuard** - Route protection component

## Setup Instructions

### 1. Supabase Configuration

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Configure authentication providers in Authentication > Providers

### 2. Environment Variables

Create a `.env` file in the frontend package (`packages/frontend/.env`):

```bash
# Copy the example file and modify with your values
cp packages/frontend/env.example packages/frontend/.env
```

Then edit `packages/frontend/.env` with your Supabase credentials:

```bash
# Supabase Configuration
PUBLIC_ENV__SUPABASE_URL=https://your-project.supabase.co
PUBLIC_ENV__SUPABASE_ANON_KEY=your-anon-key

# Google OAuth
PUBLIC_ENV__GOOGLE_CLIENT_ID=your-google-client-id

# Production Base URL (required for OAuth redirects in deployed environments)
PUBLIC_ENV__BASE_URL=https://your-app-domain.com
```

**Important Notes:**

- Vike uses the `PUBLIC_ENV__` prefix for environment variables that need to be accessible on the client side
- This is different from standard Vite apps that use `VITE_` prefix
- Make sure the `.env` file is in the `packages/frontend/` directory, not the workspace root
- Add `*.env` to `.gitignore` to avoid committing sensitive information
- **Required:** Your `vite.config.ts` must include `envPrefix: ['VITE_', 'PUBLIC_ENV__']` to expose these variables to the client

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - For popup authentication, also add your site's origin (e.g., `https://your-app.com`)
4. Configure in Supabase Authentication > Providers > Google

**Important for popup authentication:**

- Ensure your domain is added to the authorized JavaScript origins in Google Cloud Console
- The popup method provides a better user experience by keeping users on your site

### 5. Avatar Storage Setup (Optional but Recommended)

Google profile images often have CORS restrictions. The app handles this in two ways:

1. **CORS Proxy (Default)**: Uses `images.weserv.nl` to proxy Google profile images
2. **Supabase Storage Caching**: Downloads and caches avatars in your Supabase project

To enable avatar caching, create a storage bucket in your Supabase project:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `avatars`
3. Set the bucket to public
4. The system will automatically cache Google profile images on first login

**Benefits of caching:**

- Faster loading times
- No CORS issues
- Reliable image availability
- Reduced dependency on external services

## Deployment Configuration

When deploying your application, you need to ensure the OAuth redirect URLs are configured correctly:

### Environment Variables for Production

Set these environment variables in your deployment platform:

```bash
PUBLIC_ENV__BASE_URL=https://your-app-domain.com
PUBLIC_ENV__SUPABASE_URL=https://your-project.supabase.co
PUBLIC_ENV__SUPABASE_ANON_KEY=your-anon-key
PUBLIC_ENV__GOOGLE_CLIENT_ID=your-google-client-id
```

### Google Cloud Console Configuration

Update your OAuth 2.0 client in Google Cloud Console:

1. **Authorized JavaScript origins**: Add your production domain

   - `https://your-app-domain.com`

2. **Authorized redirect URIs**: Add your production callback URLs
   - `https://your-project.supabase.co/auth/v1/callback` (for Supabase)
   - `https://your-app-domain.com/auth/callback` (for your app)

### Supabase Configuration

In your Supabase project dashboard:

1. Go to **Authentication** > **URL Configuration**
2. Add your production domain to **Site URL**
3. Add redirect URLs to **Redirect URLs**:
   - `https://your-app-domain.com/auth/callback`
   - `https://your-app-domain.com/**` (wildcard for development)

## Usage

### Protecting Routes

```tsx
import { AuthGuard } from '@packing-list/shared-components';

function App() {
  return (
    <AuthGuard>
      <ProtectedContent />
    </AuthGuard>
  );
}
```

### Using Authentication Hook

```tsx
import { useAuth } from '@packing-list/shared-components';

function MyComponent() {
  const { user, loading, signInWithGooglePopup, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return (
      <button onClick={() => signInWithGooglePopup()}>
        Sign In with Google
      </button>
    );
  }

  return (
    <div>
      Welcome {user.email}!<button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Login Form

```tsx
import { LoginForm } from '@packing-list/shared-components';

function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <LoginForm />
    </div>
  );
}
```

### User Profile

```tsx
import { UserProfile } from '@packing-list/shared-components';

function Header() {
  return (
    <header>
      <nav>
        {/* Other nav items */}
        <UserProfile />
      </nav>
    </header>
  );
}
```

## API Reference

### AuthService

#### Methods

- `signInWithPassword(email: string, password: string)` - Email/password login
- `signUp(email: string, password: string, metadata?)` - User registration
- `signInWithGooglePopup()` - Google OAuth login via popup window
- `signInWithGoogle()` - Google OAuth login via redirect (legacy)
- `signOut()` - Sign out current user
- `resetPassword(email: string)` - Send password reset email (for future use)
- `updatePassword(password: string)` - Update user password (for future use)
- `subscribe(callback)` - Subscribe to auth state changes
- `getState()` - Get current auth state

#### State

```typescript
interface AuthState {
  user: AuthUser | null;
  session: any | null;
  loading: boolean;
  error: string | null;
}

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}
```

### useAuth Hook

Returns the current auth state plus convenience methods:

```typescript
const {
  user,
  session,
  loading,
  error,
  signInWithGooglePopup,
  signInWithGoogle, // legacy redirect method
  signOut,
  resetPassword,
  updatePassword,
} = useAuth();
```

**Primary method:** Use `signInWithGooglePopup()` for the best user experience with popup-based authentication.

## Security Considerations

1. **Environment Variables**: Never commit actual Supabase credentials to version control
2. **Row Level Security**: Configure RLS policies in Supabase for data protection
3. **HTTPS**: Always use HTTPS in production
4. **Session Management**: Sessions are automatically managed by Supabase

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**

   - Ensure `PUBLIC_ENV__SUPABASE_URL` and `PUBLIC_ENV__SUPABASE_ANON_KEY` are set
   - Check that environment variables are prefixed with `PUBLIC_ENV__` (for Vike) not `VITE_`
   - Verify the `.env` file is in the frontend package directory
   - **Important:** Ensure `vite.config.ts` includes `envPrefix: ['VITE_', 'PUBLIC_ENV__']`

2. **Environment variables are undefined in the browser**

   - This usually means the `envPrefix` configuration is missing from `vite.config.ts`
   - Add `envPrefix: ['VITE_', 'PUBLIC_ENV__']` to your Vite configuration
   - Restart the dev server after making config changes

3. **OAuth redirect errors**

   - Verify redirect URLs in Google Cloud Console
   - Check Supabase OAuth provider configuration

4. **Popup authentication issues**

   - Ensure popup blockers are disabled for your site
   - Verify your domain is in Google Cloud Console authorized JavaScript origins
   - Check browser console for popup-related errors
   - If popup is blocked, the login will fail silently

5. **Build errors with auth package**
   - Ensure the auth package is built: `cd packages/auth && pnpm exec tsc`
   - Check that dependencies are properly installed

### Development

To work on the authentication system:

1. Build the auth package: `cd packages/auth && pnpm exec tsc`
2. Start the frontend: `cd packages/frontend && pnpm dev`
3. Test authentication flows in the browser

## Future Enhancements

- [ ] Multi-factor authentication
- [ ] Social login with additional providers
- [ ] User profile management
- [ ] Email verification flow
- [ ] Password strength requirements
- [ ] Session timeout handling

### 3. Vite Configuration

Ensure your `packages/frontend/vite.config.ts` includes the `envPrefix` configuration:

```typescript
export default defineConfig({
  // ... other config
  envPrefix: ['VITE_', 'PUBLIC_ENV__'],
  // ... rest of config
});
```

This tells Vite to expose environment variables with both `VITE_` and `PUBLIC_ENV__`

## Environment Variables

### Required Variables

```bash
# Supabase Configuration
PUBLIC_ENV__SUPABASE_URL=https://your-project.supabase.co
PUBLIC_ENV__SUPABASE_ANON_KEY=your-anon-key

# Google OAuth
PUBLIC_ENV__GOOGLE_CLIENT_ID=your-google-client-id

# Production Base URL (required for OAuth redirects in deployed environments)
PUBLIC_ENV__BASE_URL=https://your-app-domain.com
```

**Important for Deployment:**

- `PUBLIC_ENV__BASE_URL` must be set to your production domain for OAuth redirects to work correctly
- This overrides the automatic detection from `window.location.origin`
- For local development, this can be omitted (will default to `http://localhost:3000`)

### Custom Domain (Recommended)

For better OAuth branding, set up a custom domain for Supabase:

```bash
# Use custom domain instead of supabase.co
PUBLIC_ENV__SUPABASE_URL=https://auth.yourdomain.com
```

**Benefits of Custom Domain:**

- Google OAuth popup shows your domain instead of Supabase
- Better user trust and brand consistency
- Professional appearance

**Setup Steps:**

1. Configure custom domain in Supabase Dashboard (Settings > Custom Domains)
2. Update DNS records as instructed
3. Wait for SSL certificate verification
4. Update environment variable with custom domain
5. Update Google Cloud Console redirect URLs
