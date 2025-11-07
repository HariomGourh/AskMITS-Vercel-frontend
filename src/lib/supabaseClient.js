import { createClient } from '@supabase/supabase-js';

// Resolve Supabase credentials from common environments (Vite, CRA) or window fallbacks
const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_URL) ||
  (typeof window !== 'undefined' && window.SUPABASE_URL) ||
  '';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||    // typeof import !== 'undefined' && 
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_ANON_KEY) ||
  (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  // For local/dev you can set:
  // - Vite: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY in .env
  // - CRA: REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY in .env
  // - Or set window.SUPABASE_URL and window.SUPABASE_ANON_KEY before loading the app
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY. Configure your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Convenience auth helpers
export async function signUpWithEmail(email, password) {
  return await supabase.auth.signUp({ email, password });
}

export async function signInWithEmail(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

