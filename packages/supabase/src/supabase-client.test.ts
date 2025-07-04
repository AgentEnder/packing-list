import { describe, it, expect, beforeEach } from 'vitest';
import { getSupabaseClient, isSupabaseAvailable } from './supabase-client.js';
import { createClient } from '@supabase/supabase-js';

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => ({})) }));

const env = process.env;

describe('supabase client', () => {
  beforeEach(() => {
    process.env = { ...env };
    delete process.env.PUBLIC_ENV__SUPABASE_URL;
    delete process.env.PUBLIC_ENV__SUPABASE_ANON_KEY;
  });

  it('reports availability based on env vars', () => {
    expect(isSupabaseAvailable()).toBe(false);
    process.env.PUBLIC_ENV__SUPABASE_URL = 'url';
    process.env.PUBLIC_ENV__SUPABASE_ANON_KEY = 'key';
    expect(isSupabaseAvailable()).toBe(true);
  });

  it('creates a client with env vars', () => {
    process.env.PUBLIC_ENV__SUPABASE_URL = 'url';
    process.env.PUBLIC_ENV__SUPABASE_ANON_KEY = 'key';
    const client = getSupabaseClient();
    expect(createClient).toHaveBeenCalledWith('url', 'key');
    expect(client).toBeDefined();
  });
});
