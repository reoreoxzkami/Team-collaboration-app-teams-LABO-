import { RotateCcw } from "lucide-react";
import { useStore } from "../store";
import { Avatar } from "./Avatar";
import { StatusDot } from "./StatusDot";

export const Header = () => {
  const { members, currentUserId, setCurrentUser, resetDemoData } = useStore();
  const me = members.find((m) => m.id === currentUserId);

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-brand-600">
          Welcome back
        </div>
        <h1 className="font-display text-3xl font-extrabold leading-tight md:text-4xl">
          こんにちは、
          <span className="gradient-text">{me?.name ?? "ゲスト"}</span>
          <span className="ml-2">{me?.emoji}</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          今日もチームを少しだけ明るくしよう ✨
        </p>
      </div>

      <div className="flex items-center gap-3">
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

        <div className="glass-panel flex items-center gap-2 py-1.5 pl-1.5 pr-3">
          <Avatar member={me} size="md" ring />
          <div className="text-xs">
            <div className="font-bold text-slate-800">{me?.name}</div>
            <div className="flex items-center gap-1 text-slate-500">
              <StatusDot status={me?.status ?? "online"} />
              <span>{me?.role}</span>
            </div>
          </div>
          <select
            aria-label="現在のユーザー"
            className="ml-1 rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs font-semibold text-slate-700"
            value={currentUserId}
            onChange={(e) => setCurrentUser(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
