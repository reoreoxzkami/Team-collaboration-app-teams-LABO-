import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface AuthState {
  ready: boolean;
  session: Session | null;
  user: User | null;
}

export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({
    ready: !isSupabaseConfigured, // if not configured, ready immediately with no session
    session: null,
    user: null,
  });

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setState({
        ready: true,
        session: data.session,
        user: data.session?.user ?? null,
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        ready: true,
        session,
        user: session?.user ?? null,
      });
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
};
