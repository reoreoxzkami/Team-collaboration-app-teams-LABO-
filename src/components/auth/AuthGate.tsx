import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { isSupabaseConfigured } from "../../lib/supabase";
import { LoginPage } from "./LoginPage";
import { TeamChooser } from "./TeamChooser";

const ACTIVE_TEAM_KEY = "teams-labo-active-team";

type Team = { id: string; name: string; invite_code: string };

interface Props {
  children: ReactNode;
}

/**
 * Wraps the app with Supabase auth + team selection.
 *
 * - If Supabase is not configured → passes through (local demo mode).
 * - If not signed in → shows LoginPage.
 * - If signed in but no active team → shows TeamChooser.
 * - Otherwise renders the app.
 */
export const AuthGate = ({ children }: Props) => {
  const { ready, user } = useAuth();
  const [activeTeam, setActiveTeam] = useState<Team | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(ACTIVE_TEAM_KEY);
      return raw ? (JSON.parse(raw) as Team) : null;
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

  return <>{children}</>;
};
