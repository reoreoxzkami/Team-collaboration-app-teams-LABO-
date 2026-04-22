import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Supabase client. When the env vars are not configured the client is `null`
 * and the app gracefully falls back to local-only demo mode.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }) : null;

export const isSupabaseConfigured = supabase !== null;
