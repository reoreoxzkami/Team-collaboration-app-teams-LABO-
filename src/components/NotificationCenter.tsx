import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BellRing,
  CheckSquare,
  Heart,
  MessageSquare,
  Vote,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useStore } from "../store";
import { useNotifications } from "../hooks/useNotifications";
import type { AppNotification, Member, NotificationKind } from "../types";

const KIND_ICON: Record<NotificationKind, React.ReactNode> = {
  "comment.mention": <MessageSquare className="h-4 w-4" />,
  "comment.on_assigned_task": <MessageSquare className="h-4 w-4" />,
  "task.assigned": <CheckSquare className="h-4 w-4" />,
  "kudos.received": <Heart className="h-4 w-4" />,
  "poll.created": <Vote className="h-4 w-4" />,
};

const KIND_ACCENT: Record<NotificationKind, string> = {
  "comment.mention": "from-fuchsia-500 to-violet-500",
  "comment.on_assigned_task": "from-violet-500 to-indigo-500",
  "task.assigned": "from-sky-500 to-cyan-500",
  "kudos.received": "from-pink-500 to-rose-500",
  "poll.created": "from-emerald-500 to-teal-500",
};

const describe = (n: AppNotification, actor: Member | undefined): string => {
  const who = actor?.name ?? "誰か";
  const title = typeof n.payload.title === "string" ? n.payload.title : "";
  switch (n.kind) {
    case "comment.mention":
      return `${who} があなたを ${title ? `「${title}」で` : ""}@メンションしました`;
    case "comment.on_assigned_task":
      return `${who} があなたの担当タスク「${title}」にコメントしました`;
    case "task.assigned":
      return `${who} がタスク「${title}」をあなたに割り当てました`;
    case "kudos.received":
      return `${who} から Kudos が届きました ${
        typeof n.payload.emoji === "string" ? n.payload.emoji : ""
      }`;
    case "poll.created":
      return `${who} が新しい投票「${
        typeof n.payload.question === "string" ? n.payload.question : ""
      }」を作成しました`;
    default:
      return n.kind;
  }
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "今";
  if (diffMin < 60) return `${diffMin}分前`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}時間前`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}日前`;
  return d.toLocaleDateString("ja-JP");
};

export const NotificationCenter = () => {
  const { user } = useAuth();
  const { members, cloud } = useStore();
  const { items, unreadCount, markRead, markAllRead } = useNotifications(
    user?.id ?? null,
    cloud?.teamId ?? null,
  );
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!cloud) return null;

  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
        }}
        className="btn-icon relative"
        title={unreadCount > 0 ? `未読 ${unreadCount} 件` : "通知"}
        aria-label="通知"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-base">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-40 mt-2 w-[min(360px,92vw)] origin-top-right"
          >
            <div className="glass-card overflow-hidden p-0 shadow-xl">
              <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
                <div>
                  <div className="eyebrow text-brand-600">Inbox</div>
                  <div className="font-display text-sm font-extrabold text-ink-primary">
                    通知{" "}
                    {unreadCount > 0 && (
                      <span className="ml-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-1.5 py-0.5 text-[10px] text-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      void markAllRead();
                    }}
                    className="text-[11px] font-semibold text-brand-600 hover:underline"
                  >
                    すべて既読
                  </button>
                )}
              </div>

              <ul className="max-h-[min(480px,70vh)] overflow-y-auto">
                {items.length === 0 && (
                  <li className="px-4 py-8 text-center text-sm text-ink-tertiary">
                    まだ通知はありません。
                  </li>
                )}
                {items.map((n) => {
                  const actor = n.actorId ? memberMap.get(n.actorId) : undefined;
                  const unread = !n.readAt;
                  return (
                    <li
                      key={n.id}
                      className={`flex items-start gap-3 border-b border-line/50 px-4 py-3 transition ${
                        unread
                          ? "bg-brand-50/60 dark:bg-brand-500/5"
                          : "bg-transparent"
                      } hover:bg-surface-raised/60`}
                    >
                      <div
                        className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm ${KIND_ACCENT[n.kind]}`}
                      >
                        {KIND_ICON[n.kind]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] leading-snug text-ink-primary">
                          {describe(n, actor)}
                        </div>
                        <div className="mt-0.5 text-[10px] font-medium text-ink-tertiary">
                          {formatTime(n.createdAt)}
                        </div>
                      </div>
                      {unread && (
                        <button
                          type="button"
                          onClick={() => {
                            void markRead([n.id]);
                          }}
                          className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-aurora-violet text-[10px] text-white"
                          title="既読にする"
                          aria-label="既読にする"
                        >
                          ●
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
