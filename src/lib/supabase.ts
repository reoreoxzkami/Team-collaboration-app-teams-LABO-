import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Normalize the Supabase project URL. The Supabase JS client expects only the
 * origin (e.g. `https://xxxx.supabase.co`) and appends `/auth/v1/...`,
 * `/rest/v1/...`, etc. internally. If a user pastes the REST URL with path
 * (`.../rest/v1/`) or a trailing slash, requests would become
 * `/rest/v1/auth/v1/signup` and fail with "Invalid path specified in request URL".
 */
const url = rawUrl
  ? (() => {
      try {
        const u = new URL(rawUrl.trim());
        return `${u.protocol}//${u.host}`;
      } catch {
        return rawUrl;
      }
    })()
  : undefined;

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
