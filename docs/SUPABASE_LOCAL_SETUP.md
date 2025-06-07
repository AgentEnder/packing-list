# Supabase Local Development & E2E Testing Setup

This guide covers the complete setup for running Supabase locally for development and end-to-end testing, including seeded test users for authentication flows.

## Overview

Your project is configured with:

- **Local Supabase instance** for development and testing
- **Seeded test users** for e2e authentication testing
- **Comprehensive auth utilities** for e2e test automation
- **Complex auth flows** with local/remote user support
- **Cross-platform Node.js scripts** for setup and validation

## Quick Start

```bash
# 1. Install dependencies (includes local Supabase CLI)
pnpm install

# 2. Start Docker Desktop or Podman

# 3. Run the setup script
pnpm setup:supabase

# 4. Run your app with local Supabase
pnpm nx serve frontend

# 5. Run e2e tests with auth
pnpm nx e2e frontend-e2e
```

## Prerequisites

1. **Container Runtime** - Docker Desktop or Podman (running and accessible)
2. **Node.js & pnpm** - For package management
3. **No global installs required** - Supabase CLI is installed locally

## Configuration Files

### 📁 `packages/supabase/config.toml`

Main Supabase configuration with:

- Local service ports (API: 54321, DB: 54322, Studio: 54323)
- Database seeding enabled
- Auth providers configured (Google OAuth)
- Email testing via Inbucket

### 📁 `packages/supabase/seed.sql`

Contains:

- **Test users** for e2e authentication
- **Helper functions** for user management
- **Database reset utilities**
- **Application-specific seed data** (customize as needed)

### 📁 `.env.e2e`

Environment variables for e2e testing:

```bash
PUBLIC_ENV__SUPABASE_URL=http://localhost:54321
PUBLIC_ENV__SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=dummy
PUBLIC_ENV__BASE_URL=/
PUBLIC_ENV__LOCATION=http://localhost:3000
```

### 📁 `scripts/`

Cross-platform Node.js scripts:

- **`setup-local-supabase.js`** - Complete setup automation
- **`validate-setup.js`** - Validates configuration and dependencies

## Test Users

The following users are automatically seeded for e2e testing:

| User Type        | Email                    | Password           | Use Case                  |
| ---------------- | ------------------------ | ------------------ | ------------------------- |
| **Regular User** | `e2e-test@example.com`   | `testpassword123`  | Standard auth flows       |
| **Admin User**   | `e2e-admin@example.com`  | `adminpassword123` | Admin permissions testing |
| **Google User**  | `e2e-google@example.com` | _(OAuth)_          | Google OAuth testing      |

## E2E Authentication Testing

### 📁 `e2e/frontend-e2e/src/auth-utils.ts`

Comprehensive utilities for auth testing:

```typescript
import { signInWithEmail, signOut, E2E_TEST_USERS } from './auth-utils.js';

// Sign in with test user
await signInWithEmail(page, E2E_TEST_USERS.regular);

// Test Google OAuth (mocked)
await mockGoogleSignIn(page, E2E_TEST_USERS.google);

// Fast auth setup (bypasses UI)
await setDirectAuthState(page, E2E_TEST_USERS.admin);

// Complete auth flow test
await testAuthFlow(page);
```

### Available Auth Test Functions

| Function               | Purpose                          |
| ---------------------- | -------------------------------- |
| `signInWithEmail()`    | Standard email/password login    |
| `signOut()`            | Sign out current user            |
| `mockGoogleSignIn()`   | Mock Google OAuth flow           |
| `setDirectAuthState()` | Direct auth state for fast setup |
| `testAuthFlow()`       | Complete sign-in/sign-out cycle  |
| `waitForAuthReady()`   | Wait for auth initialization     |
| `getAuthState()`       | Get current auth state           |

### 📁 `e2e/frontend-e2e/src/auth-flows.spec.ts`

Comprehensive auth test suite covering:

- Email/password authentication
- Google OAuth flows
- Auth state management
- Protected routes
- Local vs remote auth
- Error handling scenarios

## Manual Setup Steps

If you prefer manual setup over the script:

### 1. Start Supabase Services

```bash
cd packages/supabase
supabase start
```
