import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Clock,
  MessageSquare,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useStore } from "../store";
import type { Member, Task, TaskPriority, TaskStatus } from "../types";
import { Avatar } from "./Avatar";
import { TaskCommentsOverlay } from "./TaskCommentsPanel";
import { EmptyState } from "./EmptyState";

const COLUMNS: { id: TaskStatus; label: string; accent: string; emoji: string }[] =
  [
    {
      id: "todo",
      label: "To Do",
      accent: "from-slate-400 to-slate-500",
      emoji: "📝",
    },
    {
      id: "doing",
      label: "Doing",
      accent: "from-sky-500 to-indigo-500",
      emoji: "🚧",
    },
    {
      id: "review",
      label: "Review",
      accent: "from-amber-500 to-orange-500",
      emoji: "👀",
    },
    {
      id: "done",
      label: "Done",
      accent: "from-emerald-500 to-teal-500",
      emoji: "🎉",
    },
  ];

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-200",
  high: "bg-rose-500/15 text-rose-700 dark:text-rose-200",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

// Date inputs (`<input type="date">`) are timezone-agnostic YYYY-MM-DD strings;
// we have to convert between them and ISO timestamps in the **local** timezone,
// otherwise JST users see "April 24" stored as `2026-04-23T15:00Z` and re-read
// back as `2026-04-23`, shifting every due date a day earlier.
const toInputDate = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fromInputDate = (v: string): string | null => {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  // Local-midnight preserves the day the user picked when we later re-read
  // with Date#getFullYear etc.
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0).toISOString();
};

interface DueChipProps {
  due: string;
}
const DueChip = ({ due }: DueChipProps) => {
  const now = Date.now();
  const t = new Date(due).getTime();
  const days = Math.floor((t - now) / (24 * 60 * 60 * 1000));
  let cls = "bg-surface-raised text-ink-secondary ring-1 ring-line";
  let label: string;
  if (days < 0) {
    cls = "bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/30 dark:text-rose-200";
    label = `${Math.abs(days)}日超過`;
  } else if (days === 0) {
    cls = "bg-amber-500/20 text-amber-800 ring-1 ring-amber-500/40 dark:text-amber-200";
    label = "今日";
  } else if (days === 1) {
    cls = "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-200";
    label = "明日";
  } else if (days <= 7) {
    cls = "bg-sky-500/15 text-sky-700 ring-1 ring-sky-500/30 dark:text-sky-200";
    label = `${days}日後`;
  } else {
    label = new Date(due).toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
    });
  }
  return (
    <span className={`chip ${cls}`} title={new Date(due).toLocaleDateString("ja-JP")}>
      <CalendarDays className="h-3 w-3" />
      {label}
    </span>
  );
};

interface Props {
  focusTaskId?: string | null;
  onTaskFocused?: () => void;
}

export const TaskBoard = ({ focusTaskId, onTaskFocused }: Props = {}) => {
  const {
    tasks,
    members,
    addTask,
    updateTask,
    reorderTask,
    removeTask,
    cloud,
  } = useStore();

  const [draft, setDraft] = useState({
    title: "",
    description: "",
    assigneeId: "" as string,
    priority: "medium" as TaskPriority,
    dueDate: "",
    tagsInput: "",
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  // Optimistic ordered view so reorder feels instant before the RPC returns.
  const [optimistic, setOptimistic] = useState<Task[] | null>(null);
  const [commentsTask, setCommentsTask] = useState<Task | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  // Handle "jump to task" flow from command palette.
  useEffect(() => {
    if (!focusTaskId) return;
    const el = document.getElementById(`task-${focusTaskId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-4", "ring-brand-500/40");
      window.setTimeout(() => {
        el.classList.remove("ring-4", "ring-brand-500/40");
      }, 1400);
    }
    onTaskFocused?.();
  }, [focusTaskId, onTaskFocused]);

  const visibleTasks = optimistic ?? tasks;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const tasksByCol = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      doing: [],
      review: [],
      done: [],
    };
    for (const t of visibleTasks) grouped[t.status].push(t);
    for (const k of Object.keys(grouped) as TaskStatus[]) {
      grouped[k].sort((a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0));
    }
    return grouped;
  }, [visibleTasks]);

  const activeTask = activeId
    ? visibleTasks.find((t) => t.id === activeId) ?? null
    : null;

  const submit = () => {
    if (!draft.title.trim()) return;
    const tags = draft.tagsInput
      .split(/[,\u3001\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    addTask({
      title: draft.title.trim(),
      description: draft.description.trim(),
      assigneeId: draft.assigneeId || null,
      priority: draft.priority,
      dueDate: fromInputDate(draft.dueDate),
      tags,
    });
    setDraft({
      title: "",
      description: "",
      assigneeId: "",
      priority: "medium",
      dueDate: "",
      tagsInput: "",
    });
    titleRef.current?.focus();
  };

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const findContainer = (id: string): TaskStatus | null => {
    if (COLUMNS.some((c) => c.id === id)) return id as TaskStatus;
    const t = visibleTasks.find((x) => x.id === id);
    return t ? t.status : null;
  };

  const onDragOver = (e: DragOverEvent) => {
    const activeIdStr = String(e.active.id);
    if (!e.over) return;
    const overIdStr = String(e.over.id);
    const srcCol = findContainer(activeIdStr);
    const dstCol = findContainer(overIdStr);
    if (!srcCol || !dstCol || srcCol === dstCol) return;
    // Move across columns optimistically while dragging.
    setOptimistic((prev) => {
      const list = prev ?? tasks.slice();
      return list.map((t) =>
        t.id === activeIdStr ? { ...t, status: dstCol } : t,
      );
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const activeIdStr = String(e.active.id);
    setActiveId(null);

    const overIdStr = e.over ? String(e.over.id) : null;
    const srcCol = findContainer(activeIdStr);
    const dstCol = overIdStr ? findContainer(overIdStr) : srcCol;
    if (!srcCol || !dstCol) {
      setOptimistic(null);
      return;
    }

    // Build destination order after drop (newest=higher sortOrder first).
    const source = optimistic ?? tasks;
    const dstTasks = source
      .filter((t) => t.id !== activeIdStr && t.status === dstCol)
      .sort((a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0));

    let insertIdx = dstTasks.length; // default: to the bottom of the column
    if (overIdStr && overIdStr !== activeIdStr) {
      const overIdx = dstTasks.findIndex((t) => t.id === overIdStr);
      if (overIdx >= 0) insertIdx = overIdx;
    }

    const prev = dstTasks[insertIdx - 1]?.sortOrder;
    const next = dstTasks[insertIdx]?.sortOrder;
    let newOrder: number;
    if (prev !== undefined && next !== undefined) {
      newOrder = (prev + next) / 2;
    } else if (prev !== undefined) {
      newOrder = prev - 1024;
    } else if (next !== undefined) {
      newOrder = next + 1024;
    } else {
      newOrder = Date.now();
    }

    reorderTask(activeIdStr, dstCol, newOrder);
    setOptimistic(null);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h2 className="font-display text-xl font-extrabold text-ink-primary">
          タスクボード
        </h2>
        <p className="text-sm text-ink-secondary">
          カードをドラッグ＆ドロップで並び替え・列移動できます。
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
          <input
            ref={titleRef}
            className="input md:col-span-4"
            placeholder="新しいタスクのタイトル"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <input
            className="input md:col-span-3"
            placeholder="詳細（任意）"
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
          />
          <select
            className="input md:col-span-2"
            value={draft.assigneeId}
            onChange={(e) =>
              setDraft({ ...draft, assigneeId: e.target.value })
            }
          >
            <option value="">担当者なし</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            aria-label="期限"
            className="input md:col-span-1"
            value={draft.dueDate}
            onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
          />
          <select
            className="input md:col-span-1"
            value={draft.priority}
            onChange={(e) =>
              setDraft({
                ...draft,
                priority: e.target.value as TaskPriority,
              })
            }
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
          <button className="btn-primary md:col-span-1" onClick={submit}>
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">追加</span>
          </button>
          <input
            className="input md:col-span-12"
            placeholder="タグ（カンマ区切り、例: デザイン, 緊急）"
            value={draft.tagsInput}
            onChange={(e) =>
              setDraft({ ...draft, tagsInput: e.target.value })
            }
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          setOptimistic(null);
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              col={col}
              tasks={tasksByCol[col.id]}
              canComment={!!cloud}
              members={members}
              onUpdate={(id, patch) => updateTask(id, patch)}
              onDelete={removeTask}
              onOpenComments={setCommentsTask}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <CardShell task={activeTask} dragging members={members} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskCommentsOverlay
        task={commentsTask}
        onClose={() => setCommentsTask(null)}
      />
    </div>
  );
};

interface ColumnProps {
  col: (typeof COLUMNS)[number];
  tasks: Task[];
  canComment: boolean;
  members: Member[];
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onOpenComments: (task: Task) => void;
}

const Column = ({
  col,
  tasks,
  canComment,
  members,
  onUpdate,
  onDelete,
  onOpenComments,
}: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div
      ref={setNodeRef}
      className={`glass-card flex min-h-[320px] flex-col p-4 transition ${
        isOver ? "ring-2 ring-brand-500/50" : ""
      }`}
    >
      <div
        className={`mb-3 flex items-center justify-between rounded-2xl bg-gradient-to-r ${col.accent} px-3 py-2 text-white shadow-glow`}
      >
        <div className="flex items-center gap-2 font-display text-sm font-extrabold">
          <span>{col.emoji}</span>
          <span>{col.label}</span>
        </div>
        <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold">
          {tasks.length}
        </span>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex-1 space-y-2">
          {tasks.map((t) => (
            <SortableCard
              key={t.id}
              task={t}
              canComment={canComment}
              members={members}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onOpenComments={onOpenComments}
            />
          ))}
          {tasks.length === 0 && (
            <li className="rounded-2xl border border-dashed border-line bg-surface-raised/40 p-4 text-center text-xs text-ink-tertiary">
              ここにドロップ
            </li>
          )}
        </ul>
      </SortableContext>
    </div>
  );
};

interface SortableCardProps {
  task: Task;
  canComment: boolean;
  members: Member[];
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onOpenComments: (task: Task) => void;
}

const SortableCard = ({
  task,
  canComment,
  members,
  onUpdate,
  onDelete,
  onOpenComments,
}: SortableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <li ref={setNodeRef} id={`task-${task.id}`} style={style} {...attributes}>
      <CardShell
        task={task}
        canComment={canComment}
        members={members}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onOpenComments={onOpenComments}
        dragHandleProps={listeners}
      />
    </li>
  );
};

interface CardShellProps {
  task: Task;
  dragging?: boolean;
  canComment?: boolean;
  members: Member[];
  onUpdate?: (id: string, patch: Partial<Task>) => void;
  onDelete?: (id: string) => void;
  onOpenComments?: (task: Task) => void;
  dragHandleProps?: Record<string, unknown>;
}

const CardShell = ({
  task,
  dragging,
  canComment,
  members,
  onUpdate,
  onDelete,
  onOpenComments,
  dragHandleProps,
}: CardShellProps) => {
  const assignee = members.find((m) => m.id === task.assigneeId);
  const [editingTags, setEditingTags] = useState(false);
  const [tagDraft, setTagDraft] = useState("");

  const saveTags = () => {
    if (!onUpdate) return;
    const tags = tagDraft
      .split(/[,\u3001\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    onUpdate(task.id, { tags });
    setEditingTags(false);
  };

  return (
    <div
      className={`group rounded-2xl border border-white/70 bg-surface-raised/90 p-3 shadow-sm transition dark:border-line/60 ${
        dragging
          ? "rotate-1 shadow-card ring-2 ring-brand-500/50"
          : "hover:-translate-y-0.5 hover:shadow-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="min-w-0 flex-1 cursor-grab active:cursor-grabbing"
          {...(dragHandleProps ?? {})}
        >
          <div className="text-sm font-bold text-ink-primary">{task.title}</div>
          {task.description && (
            <div className="mt-1 text-xs text-ink-secondary">
              {task.description}
            </div>
          )}
        </div>
        {!dragging && (onOpenComments || onDelete) && (
          <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
            {canComment && onOpenComments && (
              <button
                onClick={() => onOpenComments(task)}
                className="rounded-lg p-1 text-ink-tertiary transition hover:bg-brand-500/10 hover:text-brand-600"
                title="コメント"
                aria-label="コメント"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(task.id)}
                className="rounded-lg p-1 text-ink-tertiary transition hover:bg-rose-500/10 hover:text-rose-500"
                title="削除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {onUpdate ? (
          <select
            className={`chip cursor-pointer border-0 outline-none ${PRIORITY_STYLE[task.priority]}`}
            value={task.priority}
            onChange={(e) =>
              onUpdate(task.id, { priority: e.target.value as TaskPriority })
            }
          >
            {(["low", "medium", "high"] as TaskPriority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        ) : (
          <span className={`chip ${PRIORITY_STYLE[task.priority]}`}>
            {PRIORITY_LABEL[task.priority]}
          </span>
        )}
        {task.dueDate && <DueChip due={task.dueDate} />}
        {onUpdate ? (
          <input
            type="date"
            className="rounded-full border border-line bg-surface-raised px-2 py-0.5 text-[11px] text-ink-secondary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            value={toInputDate(task.dueDate)}
            onChange={(e) =>
              onUpdate(task.id, { dueDate: fromInputDate(e.target.value) })
            }
            title="期限"
          />
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        {(task.tags ?? []).map((tag) => (
          <span
            key={tag}
            className="chip bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/20 dark:text-brand-200"
          >
            <Tag className="h-3 w-3" />
            {tag}
          </span>
        ))}
        {onUpdate && !dragging && (
          <>
            {editingTags ? (
              <span className="flex items-center gap-1">
                <input
                  autoFocus
                  className="rounded-full border border-line bg-surface-raised px-2 py-0.5 text-[11px] text-ink-secondary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  placeholder="タグをカンマ区切り"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTags();
                    if (e.key === "Escape") setEditingTags(false);
                  }}
                  onBlur={saveTags}
                />
                <button
                  className="rounded-md p-0.5 text-ink-tertiary hover:text-ink-primary"
                  onClick={() => setEditingTags(false)}
                  aria-label="キャンセル"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : (
              <button
                onClick={() => {
                  setTagDraft((task.tags ?? []).join(", "));
                  setEditingTags(true);
                }}
                className="chip bg-surface-raised text-ink-tertiary ring-1 ring-line hover:text-ink-primary"
                title="タグを編集"
              >
                <Tag className="h-3 w-3" />
                {(task.tags ?? []).length === 0 ? "タグ追加" : "編集"}
              </button>
            )}
          </>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] text-ink-tertiary">
          <Clock className="h-3 w-3" />
          <span>
            {new Date(task.createdAt).toLocaleDateString("ja-JP", {
              month: "numeric",
              day: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {assignee && <Avatar member={assignee} size="sm" />}
          {onUpdate ? (
            <select
              className="rounded-lg bg-surface-raised px-1.5 py-1 text-[11px] font-semibold text-ink-secondary ring-1 ring-line"
              value={task.assigneeId ?? ""}
              onChange={(e) =>
                onUpdate(task.id, { assigneeId: e.target.value || null })
              }
            >
              <option value="">未割当</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[11px] text-ink-tertiary">
              {assignee?.name ?? "未割当"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const TaskBoardEmpty = () => (
  <EmptyState
    art="tasks"
    title="まだタスクがありません"
    description="最初のタスクを追加して、チームの動きを可視化しましょう。"
  />
);
