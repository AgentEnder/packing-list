-- ============================================================================
-- Test Users for E2E Testing and Manual Testing
-- ============================================================================

-- Insert test users into auth.users table
-- These users will be available for e2e testing scenarios and manual testing

-- Manual Test User (for development/manual testing - safe to use without affecting e2e):
-- Email: manual-test@example.com
-- Password: manualtest123

-- E2E Test Users (reserved for automated testing):
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'e2e-test@example.com',
  crypt('testpassword123', gen_salt('bf')),
  NOW(),
  NULL,
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "E2E Test User", "full_name": "E2E Test User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
), (
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'e2e-admin@example.com',
  crypt('adminpassword123', gen_salt('bf')),
  NOW(),
  NULL,
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "E2E Admin User", "full_name": "E2E Admin User", "role": "admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
), (
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-3333-3333-333333333333',
  'authenticated',
  'authenticated',
  'e2e-google@example.com',
  NULL,
  NOW(),
  NULL,
  NOW(),
  '{"provider": "google", "providers": ["google"]}',
  '{"name": "E2E Google User", "full_name": "E2E Google User", "avatar_url": "https://lh3.googleusercontent.com/a/default-user", "email": "e2e-google@example.com", "email_verified": true, "phone_verified": false, "sub": "google-user-123"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
), (
  '00000000-0000-0000-0000-000000000000',
  '99999999-9999-9999-9999-999999999999',
  'authenticated',
  'authenticated',
  'manual-test@example.com',
  crypt('manualtest123', gen_salt('bf')),
  NOW(),
  NULL,
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Manual Test User", "full_name": "Manual Test User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
), (
  '00000000-0000-0000-0000-000000000000',
  '44444444-4444-4444-4444-444444444444',
  'authenticated',
  'authenticated',
  'manual-test2@gmail.com',
  crypt('BAY6gcx-pgd6dka5qzb', gen_salt('bf')),
  NOW(),
  NULL,
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Manual Test User 2", "full_name": "Manual Test User 2"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Insert corresponding identities for each user
-- This is crucial for Supabase Auth to recognize the users for login
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  provider_id
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  jsonb_build_object(
    'sub', '11111111-1111-1111-1111-111111111111',
    'email', 'e2e-test@example.com',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  NOW(),
  NOW(),
  NOW(),
  '11111111-1111-1111-1111-111111111111'
), (
  '55555555-5555-5555-5555-555555555555',
  '22222222-2222-2222-2222-222222222222',
  jsonb_build_object(
    'sub', '22222222-2222-2222-2222-222222222222',
    'email', 'e2e-admin@example.com',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  NOW(),
  NOW(),
  NOW(),
  '22222222-2222-2222-2222-222222222222'
), (
  '66666666-6666-6666-6666-666666666666',
  '33333333-3333-3333-3333-333333333333',
  jsonb_build_object(
    'sub', 'google-user-123',
    'email', 'e2e-google@example.com',
    'email_verified', true,
    'phone_verified', false,
    'name', 'E2E Google User',
    'picture', 'https://lh3.googleusercontent.com/a/default-user',
    'iss', 'https://accounts.google.com',
    'aud', 'your-google-client-id'
  ),
  'google',
  NOW(),
  NOW(),
  NOW(),
  'google-user-123'
), (
  '77777777-7777-7777-7777-777777777777',
  '99999999-9999-9999-9999-999999999999',
  jsonb_build_object(
    'sub', '99999999-9999-9999-9999-999999999999',
    'email', 'manual-test@example.com',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  NOW(),
  NOW(),
  NOW(),
  '99999999-9999-9999-9999-999999999999'
), (
  '88888888-8888-8888-8888-888888888888',
  '44444444-4444-4444-4444-444444444444',
  jsonb_build_object(
    'sub', '44444444-4444-4444-4444-444444444444',
    'email', 'manual-test2@gmail.com',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  NOW(),
  NOW(),
  NOW(),
  '44444444-4444-4444-4444-444444444444'
);

-- Function to create a new e2e test user
CREATE OR REPLACE FUNCTION create_e2e_test_user(
  p_email text,
  p_password text DEFAULT 'testpassword123',
  p_name text DEFAULT 'E2E Test User',
  p_provider text DEFAULT 'email'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  new_identity_id uuid;
BEGIN
  new_user_id := gen_random_uuid();
  new_identity_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    p_email,
    CASE WHEN p_provider = 'email' THEN crypt(p_password, gen_salt('bf')) ELSE NULL END,
    NOW(),
    NOW(),
    jsonb_build_object('provider', p_provider, 'providers', array[p_provider]),
    jsonb_build_object('name', p_name, 'full_name', p_name, 'email', p_email),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );
  
  -- Also create the corresponding identity
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at,
    provider_id
  ) VALUES (
    new_identity_id,
    new_user_id,
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', p_email,
      'email_verified', true,
      'phone_verified', false
    ),
    p_provider,
    NOW(),
    NOW(),
    NOW(),
    new_user_id::text
  );
  
  RETURN new_user_id;
END;
$$;