import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, Loader2, MessageSquare, Send, Trash2, X } from "lucide-react";
import { useStore } from "../store";
import { useAuth } from "../hooks/useAuth";
import { useTaskComments } from "../hooks/useTaskComments";
import type { Member, Task, TaskComment } from "../types";

interface Props {
  task: Task;
  onClose: () => void;
}

/**
 * Resolve the token immediately before the caret that starts with `@`.
 * Supports both bracket form (`@[山田 太郎`) for multi-word names and the
 * plain form (`@john`) for single-word names.
 */
const getMentionToken = (value: string, caretPos: number) => {
  const upto = value.slice(0, caretPos);
  const bracket = /(?:^|\s)@\[([^\]]*)$/.exec(upto);
  if (bracket) {
    return {
      token: bracket[1],
      // `@[` is 2 characters before the token contents.
      start: upto.length - bracket[1].length - 2,
    };
  }
  const match = /(?:^|\s)@([^\s@[\]]*)$/.exec(upto);
  if (!match) return null;
  return { token: match[1], start: upto.length - match[1].length - 1 };
};

/** Matches either `@[multi word name]` or `@singleword` (no brackets). */
const MENTION_RE = /@\[([^\]]+)\]|@([^\s@[\]]+)/g;

const renderBody = (body: string, members: Member[]) => {
  const byName = new Map(members.map((m) => [m.name.toLowerCase(), m]));
  // Split on @mentions; highlight tokens that match a member name.
  const parts: (string | { name: string; member?: Member })[] = [];
  const regex = new RegExp(MENTION_RE.source, "g");
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(body)) !== null) {
    if (m.index > lastIndex) parts.push(body.slice(lastIndex, m.index));
    const name = m[1] ?? m[2];
    parts.push({ name, member: byName.get(name.toLowerCase()) });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < body.length) parts.push(body.slice(lastIndex));
  return parts.map((p, i) => {
    if (typeof p === "string") return <span key={i}>{p}</span>;
    if (p.member) {
      return (
        <span
          key={i}
          className="rounded-md bg-brand-500/15 px-1 py-0.5 font-semibold text-brand-700 dark:text-brand-200"
        >
          @{p.name}
        </span>
      );
    }
    return <span key={i}>@{p.name}</span>;
  });
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

export const TaskCommentsPanel = ({ task, onClose }: Props) => {
  const { members, cloud } = useStore();
  const { user } = useAuth();
  const { comments, loading, add, remove } = useTaskComments(
    cloud ? task.id : null,
  );

  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mentionTok, setMentionTok] = useState<{
    token: string;
    start: number;
  } | null>(null);
  const [mentionHighlight, setMentionHighlight] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const listRef = useRef<HTMLOListElement | null>(null);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );

  const mentionCandidates = useMemo(() => {
    if (!mentionTok) return [];
    const q = mentionTok.token.toLowerCase();
    return members
      .filter((m) => m.id !== user?.id)
      .filter((m) => (q ? m.name.toLowerCase().includes(q) : true))
      .slice(0, 5);
  }, [mentionTok, members, user?.id]);

  useEffect(() => {
    setMentionHighlight(0);
  }, [mentionTok?.token]);

  // Auto-scroll to bottom on new comment.
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [comments.length]);

  const resolveMentions = (text: string): string[] => {
    const ids = new Set<string>();
    const re = new RegExp(MENTION_RE.source, "g");
    let m: RegExpExecArray | null;
    const byName = new Map(members.map((x) => [x.name.toLowerCase(), x]));
    while ((m = re.exec(text)) !== null) {
      const name = m[1] ?? m[2];
      const hit = byName.get(name.toLowerCase());
      if (hit && hit.id !== user?.id) ids.add(hit.id);
    }
    return [...ids];
  };

  const onChange = (value: string) => {
    setBody(value);
    if (inputRef.current) {
      const caret = inputRef.current.selectionStart ?? value.length;
      setMentionTok(getMentionToken(value, caret));
    }
  };

  const completeMention = (name: string) => {
    if (!mentionTok || !inputRef.current) return;
    const { start } = mentionTok;
    const caret = inputRef.current.selectionStart ?? body.length;
    const before = body.slice(0, start);
    const after = body.slice(caret);
    // Multi-word names need bracket form so regexes can capture them whole.
    const token = /\s/.test(name) ? `@[${name}] ` : `@${name} `;
    const next = `${before}${token}${after}`;
    setBody(next);
    setMentionTok(null);
    // Restore focus + caret.
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      inputRef.current.focus();
      const pos = (before + token).length;
      inputRef.current.setSelectionRange(pos, pos);
    });
  };

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await add(trimmed, resolveMentions(trimmed));
      setBody("");
      setMentionTok(null);
    } catch (err) {
      console.error("teams-labo insertTaskComment error", err);
    } finally {
      setSubmitting(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionTok && mentionCandidates.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionHighlight((h) => (h + 1) % mentionCandidates.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionHighlight(
          (h) => (h - 1 + mentionCandidates.length) % mentionCandidates.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        // Clamp: candidate list may have shrunk since the highlight was set
        // (e.g. realtime member removal, token narrowing). Falling through
        // to `mentionCandidates[mentionHighlight]` would be undefined.
        const idx = Math.min(
          mentionHighlight,
          mentionCandidates.length - 1,
        );
        completeMention(mentionCandidates[idx].name);
        return;
      }
      if (e.key === "Escape") {
        setMentionTok(null);
        return;
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="glass-card flex max-h-[min(80vh,720px)] w-full max-w-xl flex-col overflow-hidden p-0"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line/70 px-4 py-3">
          <div className="min-w-0">
            <div className="eyebrow text-brand-600">Task comments</div>
            <div className="truncate font-display text-base font-extrabold text-ink-primary">
              {task.title}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <ol
          ref={listRef}
          className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
        >
          {!cloud && (
            <li className="rounded-2xl border border-dashed border-line p-4 text-center text-sm text-ink-tertiary">
              チームにサインインするとコメント機能が使えます。
            </li>
          )}
          {cloud && loading && (
            <li className="flex items-center gap-2 text-sm text-ink-tertiary">
              <Loader2 className="h-4 w-4 animate-spin" />
              読み込み中…
            </li>
          )}
          {cloud && !loading && comments.length === 0 && (
            <li className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line p-6 text-center text-sm text-ink-tertiary">
              <MessageSquare className="h-6 w-6 text-ink-tertiary" />
              <div>まだコメントはありません。</div>
              <div className="text-[11px]">
                @ でチームメンバーをメンションできます。
              </div>
            </li>
          )}
          {comments.map((c: TaskComment) => {
            const author = memberMap.get(c.authorId);
            const mine = c.authorId === user?.id;
            return (
              <li key={c.id} className="flex gap-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-gradient-to-br text-sm text-white shadow-sm ${
                    author?.color ?? "from-slate-400 to-slate-500"
                  }`}
                >
                  {author?.emoji ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-ink-primary">
                      {author?.name ?? "不明なメンバー"}
                    </span>
                    <span className="text-[11px] text-ink-tertiary">
                      {formatTime(c.createdAt)}
                    </span>
                    {mine && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("このコメントを削除しますか？")) {
                            void remove(c.id);
                          }
                        }}
                        className="ml-auto rounded-md p-1 text-ink-tertiary transition hover:bg-rose-500/10 hover:text-rose-500"
                        title="削除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-primary">
                    {renderBody(c.body, members)}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <footer className="relative border-t border-line/70 p-3">
          {mentionTok && mentionCandidates.length > 0 && (
            <div className="absolute bottom-[calc(100%-4px)] left-3 right-3 overflow-hidden rounded-xl border border-line bg-surface-raised shadow-lg">
              <ul>
                {mentionCandidates.map((m, i) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        completeMention(m.name);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                        i === mentionHighlight
                          ? "bg-brand-500/10 text-brand-700 dark:text-brand-200"
                          : "text-ink-secondary hover:bg-surface-overlay"
                      }`}
                    >
                      <AtSign className="h-3.5 w-3.5 text-ink-tertiary" />
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br text-xs text-white ${m.color}`}
                      >
                        {m.emoji}
                      </span>
                      <span className="font-semibold">{m.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={body}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="コメントを書く… @ でメンション, ⌘/Ctrl+Enter で送信"
              rows={2}
              className="input resize-none"
              disabled={!cloud || submitting}
            />
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!cloud || submitting || !body.trim()}
              className="btn-primary h-[44px] px-3"
              title="送信"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </footer>
      </motion.div>
    </motion.div>
  );
};

export const TaskCommentsOverlay = ({
  task,
  onClose,
}: {
  task: Task | null;
  onClose: () => void;
}) => (
  <AnimatePresence>
    {task && <TaskCommentsPanel task={task} onClose={onClose} />}
  </AnimatePresence>
);
