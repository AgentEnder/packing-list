import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof window !== 'undefined' && (window as any).PUBLIC_ENV__SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env.PUBLIC_ENV__SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' &&
    import.meta.env?.PUBLIC_ENV__SUPABASE_URL);

const supabaseAnonKey =
  (typeof window !== 'undefined' &&
    (window as any).PUBLIC_ENV__SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' &&
    process.env.PUBLIC_ENV__SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' &&
    import.meta.env?.PUBLIC_ENV__SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set PUBLIC_ENV__SUPABASE_URL and PUBLIC_ENV__SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
