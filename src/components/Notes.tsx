import { useState } from "react";
import { Pin, Plus, Trash2 } from "lucide-react";
import { useStore } from "../store";
import { NOTE_COLORS } from "../lib/seed";
import { timeAgo } from "../lib/time";

export const Notes = () => {
  const { notes, members, addNote, updateNote, toggleNotePin, removeNote } =
    useStore();

  const [draft, setDraft] = useState({
    title: "",
    content: "",
    color: NOTE_COLORS[0],
  });

  const submit = () => {
    if (!draft.title.trim() && !draft.content.trim()) return;
    addNote({
      title: draft.title.trim() || "無題",
      content: draft.content.trim(),
      color: draft.color,
    });
    setDraft({ title: "", content: "", color: NOTE_COLORS[0] });
  };

  const sorted = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="space-y-6">
      <section className="glass-card p-5">
        <h2 className="font-display text-xl font-extrabold text-ink-primary">共有メモ</h2>
        <p className="text-sm text-ink-secondary">
          軽くシェアしたい情報はここに。ダブルクリックで編集できます。
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
          <input
            className="input md:col-span-3"
            placeholder="タイトル"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <input
            className="input md:col-span-6"
            placeholder="内容"
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <div className="flex items-center gap-1 md:col-span-2">
            {NOTE_COLORS.map((c) => (
              <button
                key={c}
                aria-label={`color ${c}`}
                onClick={() => setDraft({ ...draft, color: c })}
                className={`h-7 w-7 rounded-full bg-gradient-to-br ${c} transition ${
                  draft.color === c
                    ? "scale-110 ring-2 ring-brand-500"
                    : "opacity-80"
                }`}
              />
            ))}
          </div>
          <button className="btn-primary md:col-span-1" onClick={submit}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((n) => {
          const author = members.find((m) => m.id === n.authorId);
          return (
            <article
              key={n.id}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${n.color} p-5 shadow-card transition hover:-translate-y-0.5`}
            >
              {n.pinned && (
                <div className="absolute right-3 top-3 rounded-full bg-white/70 p-1 text-amber-600 shadow">
                  <Pin className="h-3.5 w-3.5" />
                </div>
              )}
              <EditableField
                value={n.title}
                className="font-display text-lg font-extrabold text-ink-primary"
                placeholder="タイトル"
                onChange={(v) => updateNote(n.id, { title: v })}
              />
              <EditableField
                value={n.content}
                as="textarea"
                className="mt-2 whitespace-pre-wrap text-sm text-ink-secondary"
                placeholder="内容を入力..."
                onChange={(v) => updateNote(n.id, { content: v })}
              />

              <div className="mt-4 flex items-center justify-between text-xs text-ink-tertiary">
                <div>
                  {author?.emoji} {author?.name} ・ {timeAgo(n.updatedAt)}
                </div>
                <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => toggleNotePin(n.id)}
                    className="rounded-lg bg-white/70 p-1.5 hover:bg-white"
                    title={n.pinned ? "ピン解除" : "ピン留め"}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeNote(n.id)}
                    className="rounded-lg bg-white/70 p-1.5 text-rose-500 hover:bg-white"
                    title="削除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

const EditableField = ({
  value,
  onChange,
  className = "",
  placeholder,
  as,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  as?: "textarea";
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    if (as === "textarea") {
      return (
        <textarea
          autoFocus
          className={`${className} w-full resize-none rounded-lg bg-white/70 p-2 outline-none`}
          rows={4}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            onChange(draft);
            setEditing(false);
          }}
        />
      );
    }
    return (
      <input
        autoFocus
        className={`${className} w-full rounded-lg bg-white/70 p-2 outline-none`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          onChange(draft);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onChange(draft);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <div
      className={`${className} cursor-text`}
      onDoubleClick={() => {
        setDraft(value);
        setEditing(true);
      }}
    >
      {value || <span className="text-ink-tertiary">{placeholder}</span>}
    </div>
  );
};
