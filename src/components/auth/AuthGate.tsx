import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { isSupabaseConfigured } from "../../lib/supabase";
import { useCloudSync } from "../../lib/data/sync";
import { TeamContext, type ActiveTeam } from "../../lib/team-context";
import { LoginPage } from "./LoginPage";
import { TeamChooser } from "./TeamChooser";

const ACTIVE_TEAM_KEY = "teams-labo-active-team";

interface Props {
  children: ReactNode;
}

/**
 * Wraps the app with Supabase auth + team selection + cloud sync.
 *
 * - If Supabase is not configured → passes through (local demo mode).
 * - If not signed in → shows LoginPage.
 * - If signed in but no active team → shows TeamChooser.
 * - Otherwise renders the app with the store hydrated from Supabase.
 */
export const AuthGate = ({ children }: Props) => {
  const { ready, user } = useAuth();
  const [activeTeam, setActiveTeam] = useState<ActiveTeam | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(ACTIVE_TEAM_KEY);
      return raw ? (JSON.parse(raw) as ActiveTeam) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeTeam) {
      window.localStorage.setItem(ACTIVE_TEAM_KEY, JSON.stringify(activeTeam));
    } else {
      window.localStorage.removeItem(ACTIVE_TEAM_KEY);
    }
  }, [activeTeam]);

  // Subscribe to Supabase + hydrate store (no-op when team/user missing).
  useCloudSync(activeTeam?.id ?? null, user?.id ?? null);

  // Without Supabase: pass through (local demo mode).
  if (!isSupabaseConfigured) return <>{children}</>;

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-violet-100 via-pink-100 to-amber-100">
        <div className="glass-panel px-5 py-3 text-sm text-slate-600">
          読み込み中…
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  if (!activeTeam) {
    return (
      <TeamChooser
        userId={user.id}
        displayEmail={user.email ?? ""}
        onTeamSelected={setActiveTeam}
      />
    );
  }

  return (
    <TeamContext.Provider value={{ activeTeam, setActiveTeam }}>
      {children}
    </TeamContext.Provider>
  );
};
