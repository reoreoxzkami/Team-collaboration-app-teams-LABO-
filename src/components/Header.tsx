import { LogOut, RotateCcw, Users2 } from "lucide-react";
import { useStore } from "../store";
import { Avatar } from "./Avatar";
import { StatusDot } from "./StatusDot";
import { useAuth } from "../hooks/useAuth";
import { signOut } from "../lib/auth";
import { isSupabaseConfigured } from "../lib/supabase";
import { useActiveTeam } from "../lib/team-context";
import { ThemeToggle } from "./brand/ThemeToggle";
import { NotificationCenter } from "./NotificationCenter";

export const Header = () => {
  const { members, currentUserId, setCurrentUser, resetDemoData, cloud } =
    useStore();
  const me = members.find((m) => m.id === currentUserId);
  const { user } = useAuth();
  const { activeTeam, setActiveTeam } = useActiveTeam();

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="eyebrow text-brand-600">Welcome back</div>
        <h1 className="display-h1 leading-tight">
          こんにちは、
          <span className="gradient-text">{me?.name ?? "ゲスト"}</span>
          <span className="ml-2">{me?.emoji}</span>
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {cloud && activeTeam ? (
            <>
              <span className="font-bold text-ink-primary">
                {activeTeam.name}
              </span>{" "}
              <span className="font-mono text-[11px] text-ink-tertiary">
                #{activeTeam.invite_code}
              </span>{" "}
              — チームでつながろう ✨
            </>
          ) : (
            <>今日もチームを少しだけ明るくしよう ✨</>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <NotificationCenter />
        <ThemeToggle />

        {!cloud && (
          <button
            onClick={() => {
              if (
                confirm(
                  "デモデータを初期状態に戻します。よろしいですか？（ローカル保存のみ）",
                )
              ) {
                resetDemoData();
              }
            }}
            className="btn-ghost"
            title="デモデータをリセット"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">リセット</span>
          </button>
        )}

        {cloud && (
          <button
            onClick={() => {
              if (confirm("チームを切り替えますか？")) {
                setActiveTeam(null);
              }
            }}
            className="btn-ghost"
            title="チームを切り替える"
          >
            <Users2 className="h-4 w-4" />
            <span className="hidden sm:inline">チーム切替</span>
          </button>
        )}

        {isSupabaseConfigured && user && (
          <button
            onClick={() => {
              if (confirm("サインアウトしますか？")) {
                signOut().then(() => {
                  window.localStorage.removeItem("teams-labo-active-team");
                  window.localStorage.removeItem("teams-labo-state");
                  window.location.reload();
                });
              }
            }}
            className="btn-ghost"
            title={user.email ?? "サインアウト"}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">サインアウト</span>
          </button>
        )}

        <div className="glass-panel flex items-center gap-2 py-1.5 pl-1.5 pr-3">
          <Avatar member={me} size="md" ring />
          <div className="text-xs">
            <div className="font-bold text-ink-primary">{me?.name}</div>
            <div className="flex items-center gap-1 text-ink-tertiary">
              <StatusDot status={me?.status ?? "online"} />
              <span>{me?.role}</span>
            </div>
          </div>
          {!cloud && (
            <select
              aria-label="現在のユーザー"
              className="ml-1 rounded-lg border border-line bg-surface-raised px-2 py-1 text-xs font-semibold text-ink-secondary"
              value={currentUserId}
              onChange={(e) => setCurrentUser(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.emoji} {m.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </header>
  );
};
