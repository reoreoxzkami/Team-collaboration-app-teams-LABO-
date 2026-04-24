import { useState } from "react";
import { useStore } from "../store";
import { Avatar } from "./Avatar";
import { timeAgo } from "../lib/time";

const MOODS = [
  { e: "🔥", label: "燃えてる" },
  { e: "🚀", label: "絶好調" },
  { e: "😊", label: "ごきげん" },
  { e: "✨", label: "クリエイティブ" },
  { e: "🧠", label: "集中" },
  { e: "☕", label: "のんびり" },
  { e: "😅", label: "ちょっと疲れ" },
  { e: "🌧️", label: "ブルー" },
  { e: "🍀", label: "ラッキー" },
  { e: "💡", label: "ひらめき" },
];

export const MoodCheckin = () => {
  const { members, currentUserId, setMemberMood } = useStore();
  const me = members.find((m) => m.id === currentUserId);
  const [mood, setMood] = useState(me?.mood ?? "😊");
  const [note, setNote] = useState(me?.moodNote ?? "");

  const submit = () => {
    if (!me) return;
    setMemberMood(me.id, mood, note.trim());
  };

  const counts = MOODS.map((m) => ({
    ...m,
    count: members.filter((mem) => mem.mood === m.e).length,
  }));
  const maxCount = Math.max(1, ...counts.map((c) => c.count));

  return (
    <div className="space-y-6">
      <section className="glass-card relative overflow-hidden p-6">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-amber-300 via-orange-400 to-pink-400 opacity-70 blur-2xl"
        />
        <div className="relative">
          <h2 className="font-display text-xl font-extrabold text-ink-primary">
            今日の気分チェックイン ☀️
          </h2>
          <p className="text-sm text-ink-secondary">
            気分とひとことをチームにシェアしよう。
          </p>

          <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {MOODS.map((m) => (
              <button
                key={m.e}
                onClick={() => setMood(m.e)}
                className={`flex flex-col items-center gap-0.5 rounded-2xl p-2 text-center transition ${
                  mood === m.e
                    ? "bg-gradient-to-br from-amber-400 to-pink-500 text-white shadow-glow"
                    : "bg-surface-raised/70 text-ink-secondary hover:bg-surface-raised"
                }`}
                title={m.label}
              >
                <span className="text-2xl">{m.e}</span>
                <span className="text-[10px] font-semibold">{m.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              className="input flex-1"
              placeholder="ひとことコメント（任意）"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <button className="btn-primary" onClick={submit}>
              チェックイン
            </button>
          </div>
        </div>
      </section>

      <section className="glass-card p-5">
        <h3 className="font-display text-lg font-extrabold text-ink-primary">
          チームの気分サマリー
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {counts.map((c) => (
            <div
              key={c.e}
              className="rounded-2xl bg-surface-raised/70 p-3 text-center shadow-sm"
            >
              <div className="text-2xl">{c.e}</div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-pink-500"
                  style={{ width: `${(c.count / maxCount) * 100}%` }}
                />
              </div>
              <div className="mt-1 text-xs font-semibold text-ink-secondary">
                {c.count}人
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card p-5">
        <h3 className="font-display text-lg font-extrabold text-ink-primary">
          みんなのひとこと
        </h3>
        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-2xl border border-line/60 bg-surface-raised/70 p-3"
            >
              <Avatar member={m} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink-primary">{m.name}</span>
                  <span className="text-2xl">{m.mood}</span>
                </div>
                <div className="truncate text-sm text-ink-secondary">
                  {m.moodNote || <span className="text-ink-tertiary">——</span>}
                </div>
                <div className="text-[11px] text-ink-tertiary">
                  {timeAgo(m.moodUpdatedAt)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
