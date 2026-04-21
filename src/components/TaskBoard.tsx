import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore } from "../store";
import type { Task, TaskPriority, TaskStatus } from "../types";
import { Avatar } from "./Avatar";

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
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-rose-100 text-rose-700",
};

export const TaskBoard = () => {
  const { tasks, members, addTask, updateTaskStatus, updateTask, removeTask } =
    useStore();

  const [draft, setDraft] = useState({
    title: "",
    description: "",
    assigneeId: "" as string,
    priority: "medium" as TaskPriority,
  });
  const [dragId, setDragId] = useState<string | null>(null);

  const submit = () => {
    if (!draft.title.trim()) return;
    addTask({
      title: draft.title.trim(),
      description: draft.description.trim(),
      assigneeId: draft.assigneeId || null,
      priority: draft.priority,
    });
    setDraft({ title: "", description: "", assigneeId: "", priority: "medium" });
  };

  const onDrop = (status: TaskStatus) => {
    if (dragId) {
      updateTaskStatus(dragId, status);
      setDragId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h2 className="font-display text-xl font-extrabold">タスクボード</h2>
        <p className="text-sm text-slate-500">
          カードをドラッグ＆ドロップしてステータスを変更できます。
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
          <input
            className="input md:col-span-4"
            placeholder="新しいタスクのタイトル"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <input
            className="input md:col-span-4"
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(col.id)}
              className="glass-card flex min-h-[320px] flex-col p-4"
            >
              <div
                className={`mb-3 flex items-center justify-between rounded-2xl bg-gradient-to-r ${col.accent} px-3 py-2 text-white shadow-glow`}
              >
                <div className="flex items-center gap-2 font-display text-sm font-extrabold">
                  <span>{col.emoji}</span>
                  <span>{col.label}</span>
                </div>
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold">
                  {items.length}
                </span>
              </div>

              <ul className="flex-1 space-y-2">
                {items.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => setDragId(null)}
                    onPriority={(p) => updateTask(t.id, { priority: p })}
                    onAssignee={(a) =>
                      updateTask(t.id, { assigneeId: a || null })
                    }
                    onDelete={() => removeTask(t.id)}
                  />
                ))}
                {items.length === 0 && (
                  <li className="rounded-2xl border border-dashed border-slate-300/70 bg-white/40 p-4 text-center text-xs text-slate-400">
                    ここにドロップ
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TaskCard = ({
  task,
  onDragStart,
  onDragEnd,
  onPriority,
  onAssignee,
  onDelete,
}: {
  task: Task;
  onDragStart: () => void;
  onDragEnd: () => void;
  onPriority: (p: TaskPriority) => void;
  onAssignee: (id: string) => void;
  onDelete: () => void;
}) => {
  const { members } = useStore();
  const assignee = members.find((m) => m.id === task.assigneeId);
  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="group cursor-grab rounded-2xl border border-white/70 bg-white/90 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-slate-800">{task.title}</div>
          {task.description && (
            <div className="mt-1 text-xs text-slate-500">
              {task.description}
            </div>
          )}
        </div>
        <button
          onClick={onDelete}
          className="rounded-lg p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
          title="削除"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <select
          className={`chip cursor-pointer border-0 outline-none ${PRIORITY_STYLE[task.priority]}`}
          value={task.priority}
          onChange={(e) => onPriority(e.target.value as TaskPriority)}
        >
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <div className="flex items-center gap-2">
          {assignee && <Avatar member={assignee} size="sm" />}
          <select
            className="rounded-lg bg-white px-1.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200"
            value={task.assigneeId ?? ""}
            onChange={(e) => onAssignee(e.target.value)}
          >
            <option value="">未割当</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </li>
  );
};
