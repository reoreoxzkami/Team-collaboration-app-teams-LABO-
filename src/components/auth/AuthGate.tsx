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
    // Detect the two most likely root causes so we can show actionable guidance
    // instead of just the raw Postgres message.
    const looksLikeMissingColumn =
      /column .* does not exist|PGRST204|42703|sort_order|tags|due_date/i.test(cloudError);
    const looksLikeMissingTable =
      /relation .* does not exist|PGRST205|42P01|does not exist.*table/i.test(cloudError);
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4">
        <div className="glass-card flex max-w-lg flex-col gap-4 p-7 text-sm text-ink-secondary">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-signal-500 to-brand-600" />
            <div className="display-h2">チームデータを取得できませんでした</div>
          </div>
          <div className="rounded-xl bg-surface-sunken p-3 font-mono text-[11px] text-ink-tertiary break-words">
            {cloudError}
          </div>
          {looksLikeMissingColumn && (
            <div className="rounded-xl bg-brand-50 p-3 text-xs text-brand-900 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-100">
              <div className="mb-1 font-bold">原因の可能性: Supabase マイグレーションが未適用</div>
              <div>
                PR #9 で追加された <span className="font-mono">tags / sort_order / due_date</span> 列が Supabase に存在しない可能性があります。
                Supabase SQL Editor で
                <span className="mx-1 rounded bg-brand-500/20 px-1.5 py-0.5 font-mono">supabase/migrations/0004_task_tags_sort.sql</span>
                を実行してからもう一度お試しください。
              </div>
            </div>
          )}
          {looksLikeMissingTable && (
            <div className="rounded-xl bg-brand-50 p-3 text-xs text-brand-900 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-100">
              <div className="mb-1 font-bold">原因の可能性: テーブル未作成</div>
              <div>
                Supabase にテーブルが作成されていません。
                <span className="mx-1 rounded bg-brand-500/20 px-1.5 py-0.5 font-mono">supabase/migrations/</span>
                内の SQL を順番に実行してください。
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary self-start"
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
