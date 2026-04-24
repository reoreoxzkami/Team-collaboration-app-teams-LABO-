import {
  Activity as ActivityIcon,
  CheckSquare,
  Heart,
  MessageSquare,
  Smile,
  StickyNote,
  UserPlus,
  Vote,
} from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "../store";
import { useActivity } from "../hooks/useActivity";
import { SkeletonCard } from "./ui/Skeleton";
import type { ActivityEvent, ActivityKind, Member } from "../types";

const KIND_META: Record<
  ActivityKind,
  { icon: React.ReactNode; accent: string; label: (p: ActivityEvent) => string }
> = {
  "task.created": {
    icon: <CheckSquare className="h-4 w-4" />,
    accent: "from-sky-500 to-cyan-500",
    label: (p) => `タスク「${String(p.payload.title ?? "")}」を追加`,
  },
  "task.status_changed": {
    icon: <CheckSquare className="h-4 w-4" />,
    accent: "from-indigo-500 to-violet-500",
    label: (p) => {
      const to = String(p.payload.to ?? "");
      const title = String(p.payload.title ?? "");
      return `タスク「${title}」を ${to} に移動`;
    },
  },
  "task.assignee_changed": {
    icon: <CheckSquare className="h-4 w-4" />,
    accent: "from-indigo-500 to-purple-500",
    label: (p) => `タスク「${String(p.payload.title ?? "")}」の担当を変更`,
  },
  "task.deleted": {
    icon: <CheckSquare className="h-4 w-4" />,
    accent: "from-rose-500 to-pink-500",
    label: (p) => `タスク「${String(p.payload.title ?? "")}」を削除`,
  },
  "comment.created": {
    icon: <MessageSquare className="h-4 w-4" />,
    accent: "from-violet-500 to-fuchsia-500",
    label: (p) =>
      `タスクにコメント${p.payload.mentions_count ? `（@メンション${p.payload.mentions_count}件）` : ""}`,
  },
  "kudos.created": {
    icon: <Heart className="h-4 w-4" />,
    accent: "from-pink-500 to-rose-500",
    label: () => `Kudos を贈った`,
  },
  "poll.created": {
    icon: <Vote className="h-4 w-4" />,
    accent: "from-emerald-500 to-teal-500",
    label: (p) => `投票「${String(p.payload.question ?? "")}」を作成`,
  },
  "poll.closed": {
    icon: <Vote className="h-4 w-4" />,
    accent: "from-emerald-600 to-teal-600",
    label: (p) => `投票「${String(p.payload.question ?? "")}」を締切`,
  },
  "note.created": {
    icon: <StickyNote className="h-4 w-4" />,
    accent: "from-amber-500 to-orange-500",
    label: (p) => `メモ「${String(p.payload.title ?? "")}」を追加`,
  },
  "member.joined": {
    icon: <UserPlus className="h-4 w-4" />,
    accent: "from-sky-500 to-indigo-500",
    label: () => `チームに参加`,
  },
  "member.mood_updated": {
    icon: <Smile className="h-4 w-4" />,
    accent: "from-amber-400 to-pink-400",
    label: (p) =>
      `気分を更新 ${String(p.payload.emoji ?? "")} ${String(p.payload.note ?? "").slice(0, 40)}`,
  },
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}時間前`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}日前`;
  return d.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ActorChip = ({ actor }: { actor: Member | undefined }) => {
  if (!actor) {
    return (
      <span className="text-sm font-semibold text-ink-tertiary">
        システム
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-primary">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${actor.color} text-xs text-white shadow-sm`}
      >
        {actor.emoji}
      </span>
      {actor.name}
    </span>
  );
};

export const ActivityFeed = () => {
  const { members, cloud } = useStore();
  const { events, loading, error } = useActivity(cloud?.teamId ?? null);
  const memberMap = new Map(members.map((m) => [m.id, m]));

  if (!cloud) {
    return (
      <div className="glass-card p-8 text-center">
        <ActivityIcon className="mx-auto mb-3 h-8 w-8 text-ink-tertiary" />
        <div className="font-display text-lg font-bold text-ink-primary">
          アクティビティフィード
        </div>
        <p className="mt-2 text-sm text-ink-secondary">
          チームにサインインするとチーム全体の動きがここに表示されます。
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card border border-rose-300/60 bg-rose-50/50 p-4 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
        アクティビティの読み込みに失敗しました: {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <ActivityIcon className="mx-auto mb-3 h-8 w-8 text-ink-tertiary" />
        <div className="font-display text-lg font-bold text-ink-primary">
          まだ動きはありません
        </div>
        <p className="mt-2 text-sm text-ink-secondary">
          タスクを追加したり、Kudos を贈ったり、投票を作ると、ここにタイムラインが流れます。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="glass-card flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white shadow-glow">
          <ActivityIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="eyebrow text-brand-600">Activity Feed</div>
          <div className="text-sm text-ink-secondary">
            チーム全体の最近の動き（最新{events.length}件）
          </div>
        </div>
      </div>

      <ol className="space-y-2">
        {events.map((e, i) => {
          const meta = KIND_META[e.kind];
          const actor = e.actorId ? memberMap.get(e.actorId) : undefined;
          return (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.2 }}
              className="glass-card flex items-start gap-3 p-4"
            >
              <div
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${meta?.accent ?? "from-slate-500 to-slate-600"}`}
              >
                {meta?.icon ?? <ActivityIcon className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <ActorChip actor={actor} />
                  <span className="text-sm text-ink-secondary">
                    {meta?.label(e) ?? e.kind}
                  </span>
                </div>
                <div className="mt-1 text-[11px] font-medium text-ink-tertiary">
                  {formatTime(e.createdAt)}
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
};
