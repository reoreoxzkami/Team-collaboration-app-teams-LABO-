import {
  CheckSquare,
  Heart,
  Sparkles,
  StickyNote,
  TrendingUp,
  Users,
  Vote,
} from "lucide-react";
import { useStore } from "../store";
import { Avatar } from "./Avatar";
import { StatusDot } from "./StatusDot";
import { timeAgo } from "../lib/time";
import type { View } from "../types";

const StatCard = ({
  label,
  value,
  sub,
  gradient,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  gradient: string;
  icon: React.ReactNode;
}) => (
  <div
    className={`relative overflow-hidden rounded-3xl p-5 text-white shadow-glow ${gradient}`}
  >
    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">
          {label}
        </div>
        <div className="font-display mt-2 text-4xl font-extrabold">{value}</div>
        {sub && <div className="mt-1 text-xs opacity-90">{sub}</div>}
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/25 backdrop-blur">
        {icon}
      </div>
    </div>
  </div>
);

export const Dashboard = ({ onNavigate }: { onNavigate: (v: View) => void }) => {
  const { members, tasks, kudos, polls, notes, currentUserId } = useStore();
  const done = tasks.filter((t) => t.status === "done").length;
  const active = tasks.filter((t) => t.status !== "done").length;
  const online = members.filter(
    (m) => m.status === "online" || m.status === "focus",
  ).length;

  const latestKudos = [...kudos]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 3);

  const myTasks = tasks
    .filter((t) => t.assigneeId === currentUserId && t.status !== "done")
    .slice(0, 4);

  const topPoll = polls[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="オンライン"
          value={`${online}/${members.length}`}
          sub="今この瞬間に集まっているメンバー"
          gradient="bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500"
          icon={<Users className="h-6 w-6" />}
        />
        <StatCard
          label="アクティブなタスク"
          value={`${active}`}
          sub={`完了 ${done} 件`}
          gradient="bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500"
          icon={<CheckSquare className="h-6 w-6" />}
        />
        <StatCard
          label="今週のKudos"
          value={`${kudos.length}`}
          sub="感謝はチームを温める"
          gradient="bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500"
          icon={<Heart className="h-6 w-6" />}
        />
        <StatCard
          label="共有メモ"
          value={`${notes.length}`}
          sub={`${polls.length} 件の投票が進行中`}
          gradient="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500"
          icon={<StickyNote className="h-6 w-6" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="glass-card col-span-1 p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-extrabold text-ink-primary">
                メンバーの今
              </h2>
            </div>
            <button
              className="text-xs font-semibold text-brand-600 hover:underline"
              onClick={() => onNavigate("members")}
            >
              すべて見る →
            </button>
          </div>

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="group flex items-center gap-3 rounded-2xl border border-line/60 bg-surface-raised/70 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <Avatar member={m} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-bold text-ink-primary">{m.name}</span>
                    <StatusDot status={m.status} />
                  </div>
                  <div className="truncate text-xs text-ink-tertiary">{m.role}</div>
                  <div className="mt-1 line-clamp-1 text-xs text-ink-secondary">
                    <span className="mr-1">{m.mood}</span>
                    {m.moodNote}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white">
              <Heart className="h-5 w-5" />
            </div>
            <h2 className="font-display text-lg font-extrabold text-ink-primary">最新のKudos</h2>
          </div>
          <ul className="space-y-3">
            {latestKudos.length === 0 && (
              <li className="text-sm text-ink-secondary">
                まだKudosがありません。最初の一人になろう！
              </li>
            )}
            {latestKudos.map((k) => {
              const from = members.find((m) => m.id === k.fromId);
              const to = members.find((m) => m.id === k.toId);
              return (
                <li
                  key={k.id}
                  className={`rounded-2xl bg-gradient-to-br ${k.color} p-4 text-white shadow-glow`}
                >
                  <div className="flex items-center gap-2 text-xs opacity-95">
                    <span className="font-bold">{from?.name}</span>→
                    <span className="font-bold">{to?.name}</span>
                    <span className="ml-auto opacity-80">
                      {timeAgo(k.createdAt)}
                    </span>
                  </div>
                  <div className="mt-2 text-2xl">{k.emoji}</div>
                  <div className="text-sm leading-relaxed">{k.message}</div>
                </li>
              );
            })}
          </ul>
          <button
            onClick={() => onNavigate("kudos")}
            className="mt-4 w-full btn-primary"
          >
            Kudosを送る
          </button>
        </section>

        <section className="glass-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h2 className="font-display text-lg font-extrabold text-ink-primary">あなたのタスク</h2>
          </div>
          <ul className="space-y-2">
            {myTasks.length === 0 && (
              <li className="text-sm text-ink-secondary">
                空きがあります！新しいタスクはありません。
              </li>
            )}
            {myTasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-2xl border border-line/60 bg-surface-raised/70 p-3"
              >
                <span
                  className={`chip ${
                    t.priority === "high"
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-200"
                      : t.priority === "medium"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-200"
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
                  }`}
                >
                  {t.priority}
                </span>
                <div className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-primary">
                  {t.title}
                </div>
                <span className="text-[11px] font-semibold text-ink-tertiary">
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => onNavigate("tasks")}
            className="mt-4 w-full btn-ghost"
          >
            タスクボードへ
          </button>
        </section>

        <section className="glass-card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
              <Vote className="h-5 w-5" />
            </div>
            <h2 className="font-display text-lg font-extrabold text-ink-primary">注目の投票</h2>
          </div>
          {topPoll ? (
            <div>
              <div className="font-semibold text-ink-primary">
                {topPoll.question}
              </div>
              <ul className="mt-3 space-y-2">
                {topPoll.options.map((o) => {
                  const total = topPoll.options.reduce(
                    (acc, x) => acc + x.votes.length,
                    0,
                  );
                  const pct = total === 0 ? 0 : (o.votes.length / total) * 100;
                  return (
                    <li
                      key={o.id}
                      className="relative overflow-hidden rounded-xl border border-line/60 bg-surface-raised/70 px-3 py-2 text-sm"
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-200/60 to-teal-200/60"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <span className="font-semibold text-ink-primary">
                          {o.text}
                        </span>
                        <span className="text-xs font-bold text-ink-secondary">
                          {o.votes.length}票 ({Math.round(pct)}%)
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <button
                onClick={() => onNavigate("polls")}
                className="mt-4 btn-ghost"
              >
                投票ページへ
              </button>
            </div>
          ) : (
            <p className="text-sm text-ink-secondary">投票はまだありません。</p>
          )}
        </section>
      </div>
    </div>
  );
};
