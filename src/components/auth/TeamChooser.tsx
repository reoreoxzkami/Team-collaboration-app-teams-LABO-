import { FormEvent, useEffect, useState } from "react";
import { LogOut, Plus, Ticket, Users } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { signOut } from "../../lib/auth";

type Team = { id: string; name: string; invite_code: string };

interface Props {
  userId: string;
  displayEmail: string;
  onTeamSelected: (team: Team) => void;
}

/** Shows after auth: list memberships, create new team, or join by code. */
export const TeamChooser = ({ userId, displayEmail, onTeamSelected }: Props) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("team:teams(id, name, invite_code)")
        .eq("user_id", userId);
      if (cancelled) return;
      if (error) {
        setErr(error.message);
      } else {
        const list = (data ?? [])
          .map((row) => row.team as unknown as Team | null)
          .filter((t): t is Team => t !== null);
        setTeams(list);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const createTeam = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !newTeamName.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const { data, error } = await supabase
        .rpc("create_team", { p_name: newTeamName.trim() })
        .single<Team>();
      if (error) throw error;
      if (data) onTeamSelected(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "作成に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const joinTeam = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !joinCode.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const { data, error } = await supabase
        .rpc("join_team_by_code", { p_code: joinCode.trim().toUpperCase() })
        .single<Team>();
      if (error) throw error;
      if (data) onTeamSelected(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "参加に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="animate-slide-up mb-6 flex items-center justify-between">
          <div>
            <div className="eyebrow text-brand-600">Welcome</div>
            <h1 className="display-h1">
              <span className="gradient-text">チームを選択</span>
            </h1>
            <p className="text-sm text-ink-tertiary">{displayEmail}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="btn-ghost"
            title="サインアウト"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">サインアウト</span>
          </button>
        </div>

        {err && (
          <div className="animate-pop-in mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30">
            {err}
          </div>
        )}

        {loading ? (
          <div className="glass-panel p-6 text-sm text-ink-tertiary">読み込み中…</div>
        ) : (
          <>
            {teams.length > 0 && (
              <section className="glass-panel animate-slide-up mb-5 p-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-ink-tertiary">
                  <Users className="h-4 w-4" /> 参加中のチーム
                </h2>
                <ul className="space-y-2">
                  {teams.map((t) => (
                    <li key={t.id}>
                      <button
                        onClick={() => onTeamSelected(t)}
                        className="flex w-full items-center justify-between rounded-xl bg-surface-raised/80 p-3 text-left ring-1 ring-line transition hover:-translate-y-0.5 hover:bg-surface-raised hover:shadow-md"
                      >
                        <span className="font-bold text-ink-primary">
                          {t.name}
                        </span>
                        <span className="rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
                          {t.invite_code}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <form
                onSubmit={createTeam}
                className="glass-panel animate-slide-up p-5"
              >
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-ink-tertiary">
                  <Plus className="h-4 w-4" /> 新しいチーム
                </h2>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="チーム名（例：デザイン部）"
                  className="input"
                />
                <button
                  type="submit"
                  disabled={busy || !newTeamName.trim()}
                  className="btn-primary mt-3 w-full py-2.5"
                >
                  チームを作る
                </button>
              </form>

              <form
                onSubmit={joinTeam}
                className="glass-panel animate-slide-up p-5"
              >
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-ink-tertiary">
                  <Ticket className="h-4 w-4" /> 招待コードで参加
                </h2>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="例：ABCD-1234"
                  className="input font-mono uppercase"
                />
                <button
                  type="submit"
                  disabled={busy || !joinCode.trim()}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/30 transition hover:brightness-110 hover:-translate-y-0.5 disabled:opacity-60"
                >
                  参加する
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
