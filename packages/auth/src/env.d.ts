/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_ENV__SUPABASE_URL?: string;
  readonly PUBLIC_ENV__SUPABASE_ANON_KEY?: string;
  readonly PUBLIC_ENV__LOCATION?: string;
  readonly PUBLIC_ENV__BASE_URL?: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
