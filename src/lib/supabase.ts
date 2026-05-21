import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Local Supabase CLI defaults (only used when VITE_* vars are missing in dev).
 * Lets the app boot without a .env so UI is visible; point VITE_* at your project for real data.
 */
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
const LOCAL_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const supabaseUrl =
  envUrl || (import.meta.env.DEV ? LOCAL_SUPABASE_URL : '');
const supabaseAnonKey =
  envKey || (import.meta.env.DEV ? LOCAL_SUPABASE_ANON_KEY : '');

export const isSupabaseConfigured = Boolean(envUrl && envKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Add them to your environment for production builds.'
  );
}

if (import.meta.env.DEV && !isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[SolveInnovate] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set; using local Supabase CLI defaults. Add a .env with your project URL and anon key for real auth/data.'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
