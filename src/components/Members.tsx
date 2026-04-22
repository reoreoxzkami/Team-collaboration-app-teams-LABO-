import { useStore } from "../store";
import { Avatar } from "./Avatar";
import { StatusDot } from "./StatusDot";
import { statusLabel } from "../lib/status";
import type { MemberStatus } from "../types";
import { timeAgo } from "../lib/time";

const STATUSES: MemberStatus[] = ["online", "focus", "away", "offline"];

export const Members = () => {
  const { members, currentUserId, setMemberStatus, setCurrentUser } = useStore();

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h2 className="font-display text-xl font-extrabold">チームメンバー</h2>
        <p className="text-sm text-slate-500">
          アバターをクリックして「自分」を切り替えられます。ステータスは各自で自由に更新できます。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {members.map((m) => {
          const isMe = m.id === currentUserId;
          return (
            <div
              key={m.id}
              className={`glass-card relative overflow-hidden p-5 transition hover:-translate-y-0.5 ${
                isMe ? "gradient-border" : ""
              }`}
            >
              <div
                aria-hidden
                className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${m.color} opacity-20 blur-2xl`}
              />
              <div className="relative flex items-center gap-4">
                <button
                  title="このメンバーとしてログイン"
                  onClick={() => setCurrentUser(m.id)}
                >
                  <Avatar member={m} size="xl" ring />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-extrabold">
                      {m.name}
                    </span>
                    {isMe && (
                      <span className="chip bg-brand-100 text-brand-700">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{m.role}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusDot status={m.status} showLabel />
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-white/70 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{m.mood}</span>
                  <span className="text-slate-700">{m.moodNote}</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  気分の更新 {timeAgo(m.moodUpdatedAt)}
                </div>
              </div>

              {isMe && (
                <div className="mt-4">
                  <div className="mb-1.5 text-xs font-bold text-slate-500">
                    ステータスを変更
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setMemberStatus(m.id, s)}
                        className={`chip transition ${
                          m.status === s
                            ? "bg-brand-600 text-white"
                            : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-brand-50"
                        }`}
                      >
                        {statusLabel(s)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
