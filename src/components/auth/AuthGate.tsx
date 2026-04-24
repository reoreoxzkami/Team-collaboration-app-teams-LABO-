import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { isSupabaseConfigured } from "../../lib/supabase";
import { useCloudSync } from "../../lib/data/sync";
import { TeamContext, type ActiveTeam } from "../../lib/team-context";
import { useStore } from "../../store";
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
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="glass-panel px-5 py-3 text-sm text-ink-secondary">
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
      <HydrationGate>{children}</HydrationGate>
    </TeamContext.Provider>
  );
};

/**
 * Holds children behind the loading shell until the store's first cloud
 * snapshot has arrived, so the app never flashes seed / demo data while
 * connected to a real team.
 */
const HydrationGate = ({ children }: { children: ReactNode }) => {
  const cloudHydrated = useStore((s) => s.cloudHydrated);
  const cloudError = useStore((s) => s.cloudError);
  if (cloudError) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="glass-panel flex max-w-md flex-col gap-3 p-6 text-sm text-ink-secondary">
          <div className="text-base font-semibold text-rose-500">
            チームデータを取得できませんでした
          </div>
          <div className="text-xs text-ink-tertiary break-words">{cloudError}</div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="self-start rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:opacity-90"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }
  if (!cloudHydrated) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="glass-panel px-5 py-3 text-sm text-ink-secondary">
          チームデータを読み込み中…
        </div>
      </div>
    );
  }
  return <>{children}</>;
};
