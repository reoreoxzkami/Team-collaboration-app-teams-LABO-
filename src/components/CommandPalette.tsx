import { AnimatePresence, motion } from "framer-motion";
import { Command } from "cmdk";
import {
  Activity,
  CheckSquare,
  Heart,
  LayoutDashboard,
  Moon,
  StickyNote,
  Sparkles,
  Sun,
  Monitor,
  Users,
  UserPlus,
  Vote,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "../store";
import { useTheme } from "../lib/theme";
import type { View } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
  onOpenTask: (taskId: string) => void;
}

const NAV_ITEMS: Array<{ id: View; label: string; icon: React.ReactNode; hint: string }> = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, hint: "g d" },
  { id: "activity", label: "Activity", icon: <Activity className="h-4 w-4" />, hint: "g a" },
  { id: "members", label: "Members", icon: <Users className="h-4 w-4" />, hint: "g u" },
  { id: "tasks", label: "Task Board", icon: <CheckSquare className="h-4 w-4" />, hint: "g t" },
  { id: "kudos", label: "Kudos Wall", icon: <Heart className="h-4 w-4" />, hint: "g k" },
  { id: "mood", label: "Mood Check-in", icon: <Sparkles className="h-4 w-4" />, hint: "g m" },
  { id: "polls", label: "Polls", icon: <Vote className="h-4 w-4" />, hint: "g p" },
  { id: "notes", label: "Shared Notes", icon: <StickyNote className="h-4 w-4" />, hint: "g n" },
];

export const CommandPalette = ({ open, onClose, onNavigate, onOpenTask }: Props) => {
  const { tasks, members, kudos, notes, polls } = useStore();
  const { setMode: setTheme } = useTheme();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Safety net: close on Escape even if cmdk misses it for some reason.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const taskHits = useMemo(
    () => tasks.slice(0, 20),
    [tasks],
  );
  const memberHits = useMemo(() => members.slice(0, 20), [members]);

  const run = (fn: () => void) => {
    fn();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-ink-primary/30 px-4 pt-[12vh] backdrop-blur-sm dark:bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="コマンドパレット"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="glass-panel w-full max-w-xl overflow-hidden p-0 shadow-2xl ring-1 ring-brand-500/20"
          >
            <Command loop label="コマンドパレット" className="flex flex-col">
              <div className="flex items-center gap-2 border-b border-line/60 px-4 py-3">
                <Search className="h-4 w-4 text-ink-tertiary" />
                <Command.Input
                  autoFocus
                  placeholder="検索 / 移動 / アクション..."
                  value={query}
                  onValueChange={setQuery}
                  className="flex-1 bg-transparent text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none"
                />
                <kbd className="kbd">Esc</kbd>
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                <Command.Empty className="px-4 py-6 text-center text-xs text-ink-tertiary">
                  一致する候補がありません。
                </Command.Empty>

                <Command.Group heading="ナビゲーション">
                  {NAV_ITEMS.map((n) => (
                    <Command.Item
                      key={n.id}
                      value={`nav ${n.label}`}
                      onSelect={() => run(() => onNavigate(n.id))}
                      className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-primary data-[selected=true]:bg-brand-500/10 data-[selected=true]:text-brand-700 dark:data-[selected=true]:text-brand-200"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                        {n.icon}
                      </span>
                      <span className="flex-1">{n.label}</span>
                      <kbd className="kbd">{n.hint}</kbd>
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group heading="テーマ">
                  <Command.Item
                    value="theme light"
                    onSelect={() => run(() => setTheme("light"))}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-primary data-[selected=true]:bg-brand-500/10"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
                      <Sun className="h-4 w-4" />
                    </span>
                    ライトに切り替え
                  </Command.Item>
                  <Command.Item
                    value="theme dark"
                    onSelect={() => run(() => setTheme("dark"))}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-primary data-[selected=true]:bg-brand-500/10"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-500">
                      <Moon className="h-4 w-4" />
                    </span>
                    ダークに切り替え
                  </Command.Item>
                  <Command.Item
                    value="theme system"
                    onSelect={() => run(() => setTheme("system"))}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-primary data-[selected=true]:bg-brand-500/10"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-500/15 text-slate-500">
                      <Monitor className="h-4 w-4" />
                    </span>
                    OS に合わせる
                  </Command.Item>
                </Command.Group>

                {taskHits.length > 0 && (
                  <Command.Group heading="タスクへジャンプ">
                    {taskHits.map((t) => (
                      <Command.Item
                        key={t.id}
                        value={`task ${t.title} ${t.description}`}
                        onSelect={() => run(() => onOpenTask(t.id))}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-primary data-[selected=true]:bg-brand-500/10"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600">
                          <CheckSquare className="h-4 w-4" />
                        </span>
                        <span className="flex-1 truncate">{t.title}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary">
                          {t.status}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {memberHits.length > 0 && (
                  <Command.Group heading="メンバー">
                    {memberHits.map((m) => (
                      <Command.Item
                        key={m.id}
                        value={`member ${m.name} ${m.role}`}
                        onSelect={() => run(() => onNavigate("members"))}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-primary data-[selected=true]:bg-brand-500/10"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-fuchsia-500/15 text-fuchsia-600">
                          <UserPlus className="h-4 w-4" />
                        </span>
                        <span className="flex-1 truncate">
                          {m.emoji} {m.name}
                        </span>
                        <span className="text-[10px] text-ink-tertiary">{m.role}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                <Command.Group heading="サマリー">
                  <Command.Item
                    value={`summary kudos ${kudos.length}`}
                    disabled
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-ink-tertiary"
                  >
                    Kudos {kudos.length} 件 · メモ {notes.length} 件 · 投票 {polls.length} 件
                  </Command.Item>
                </Command.Group>
              </Command.List>

              <div className="flex items-center justify-between border-t border-line/60 px-4 py-2 text-[11px] text-ink-tertiary">
                <span className="flex items-center gap-2">
                  <kbd className="kbd">↑</kbd>
                  <kbd className="kbd">↓</kbd>
                  <span>移動</span>
                </span>
                <span className="flex items-center gap-2">
                  <kbd className="kbd">⏎</kbd>
                  <span>選択</span>
                </span>
                <span className="flex items-center gap-2">
                  <kbd className="kbd">?</kbd>
                  <span>ショートカット一覧</span>
                </span>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
