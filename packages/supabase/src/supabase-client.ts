import { createClient } from '@supabase/supabase-js';
import type { Database } from './database-types.js';

let _supabase: ReturnType<typeof createClient<Database>> | null = null;

function getSupabaseConfig() {
  const supabaseUrl =
    (typeof process !== 'undefined' && process.env.PUBLIC_ENV__SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' &&
      import.meta.env?.PUBLIC_ENV__SUPABASE_URL);

  const supabaseAnonKey =
    (typeof process !== 'undefined' &&
      process.env.PUBLIC_ENV__SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' &&
      import.meta.env?.PUBLIC_ENV__SUPABASE_ANON_KEY);

  return { supabaseUrl, supabaseAnonKey };
}

export function getSupabaseClient() {
  if (_supabase) {
    return _supabase;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set PUBLIC_ENV__SUPABASE_URL and PUBLIC_ENV__SUPABASE_ANON_KEY'
    );
  }

  _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

export function isSupabaseAvailable(): boolean {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return !!(supabaseUrl && supabaseAnonKey);
}

// Legacy export for backward compatibility - only works if env vars are available
export const supabase = new Proxy(
  {} as ReturnType<typeof createClient<Database>>,
  {
    get(target, prop) {
      return getSupabaseClient()[
        prop as keyof ReturnType<typeof createClient<Database>>
      ];
    },
  }
);
