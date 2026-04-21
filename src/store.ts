import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Kudos,
  Member,
  MemberStatus,
  Note,
  Poll,
  Task,
  TaskPriority,
  TaskStatus,
} from "./types";
import {
  INITIAL_CURRENT_USER_ID,
  KUDOS_COLORS,
  NOTE_COLORS,
  SEED_VERSION,
  seedKudos,
  seedMembers,
  seedNotes,
  seedPolls,
  seedTasks,
} from "./lib/seed";
import { uid } from "./lib/id";

interface AppState {
  version: number;
  currentUserId: string;
  members: Member[];
  tasks: Task[];
  kudos: Kudos[];
  polls: Poll[];
  notes: Note[];

  setCurrentUser: (id: string) => void;

  // members
  updateMember: (id: string, patch: Partial<Member>) => void;
  setMemberStatus: (id: string, status: MemberStatus) => void;
  setMemberMood: (id: string, mood: string, moodNote: string) => void;

  // tasks
  addTask: (input: {
    title: string;
    description?: string;
    assigneeId?: string | null;
    priority?: TaskPriority;
  }) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;

  // kudos
  addKudos: (input: { toId: string; message: string; emoji: string }) => void;
  toggleKudosReaction: (kudosId: string, emoji: string) => void;

  // polls
  addPoll: (input: { question: string; options: string[] }) => void;
  voteOnPoll: (pollId: string, optionId: string) => void;
  closePoll: (pollId: string) => void;

  // notes
  addNote: (input: { title: string; content: string; color?: string }) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  toggleNotePin: (id: string) => void;
  removeNote: (id: string) => void;

  resetDemoData: () => void;
}

const initial = () => ({
  version: SEED_VERSION,
  currentUserId: INITIAL_CURRENT_USER_ID,
  members: seedMembers(),
  tasks: seedTasks(),
  kudos: seedKudos(),
  polls: seedPolls(),
  notes: seedNotes(),
});

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...initial(),

      setCurrentUser: (id) => set({ currentUserId: id }),

      updateMember: (id, patch) =>
        set((s) => ({
          members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),

      setMemberStatus: (id, status) =>
        set((s) => ({
          members: s.members.map((m) =>
            m.id === id ? { ...m, status } : m,
          ),
        })),

      setMemberMood: (id, mood, moodNote) =>
        set((s) => ({
          members: s.members.map((m) =>
            m.id === id
              ? { ...m, mood, moodNote, moodUpdatedAt: new Date().toISOString() }
              : m,
          ),
        })),

      addTask: ({ title, description, assigneeId, priority }) =>
        set((s) => ({
          tasks: [
            {
              id: uid(),
              title,
              description: description ?? "",
              status: "todo",
              assigneeId: assigneeId ?? null,
              priority: priority ?? "medium",
              dueDate: null,
              createdAt: new Date().toISOString(),
            },
            ...s.tasks,
          ],
        })),

      updateTaskStatus: (id, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
        })),

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addKudos: ({ toId, message, emoji }) =>
        set((s) => ({
          kudos: [
            {
              id: uid(),
              fromId: s.currentUserId,
              toId,
              message,
              emoji,
              color: KUDOS_COLORS[Math.floor(Math.random() * KUDOS_COLORS.length)],
              createdAt: new Date().toISOString(),
              reactions: {},
            },
            ...s.kudos,
          ],
        })),

      toggleKudosReaction: (kudosId, emoji) =>
        set((s) => {
          const userId = s.currentUserId;
          return {
            kudos: s.kudos.map((k) => {
              if (k.id !== kudosId) return k;
              const current = k.reactions[emoji] ?? [];
              const has = current.includes(userId);
              const next = has
                ? current.filter((u) => u !== userId)
                : [...current, userId];
              const reactions = { ...k.reactions, [emoji]: next };
              if (next.length === 0) delete reactions[emoji];
              return { ...k, reactions };
            }),
          };
        }),

      addPoll: ({ question, options }) =>
        set((s) => ({
          polls: [
            {
              id: uid(),
              question,
              options: options
                .filter((o) => o.trim().length > 0)
                .map((text) => ({ id: uid(), text, votes: [] })),
              createdAt: new Date().toISOString(),
              closed: false,
              createdById: s.currentUserId,
            },
            ...s.polls,
          ],
        })),

      voteOnPoll: (pollId, optionId) =>
        set((s) => {
          const userId = s.currentUserId;
          return {
            polls: s.polls.map((p) => {
              if (p.id !== pollId) return p;
              return {
                ...p,
                options: p.options.map((o) => ({
                  ...o,
                  votes:
                    o.id === optionId
                      ? o.votes.includes(userId)
                        ? o.votes.filter((u) => u !== userId)
                        : [...o.votes.filter((u) => u !== userId), userId]
                      : o.votes.filter((u) => u !== userId),
                })),
              };
            }),
          };
        }),

      closePoll: (pollId) =>
        set((s) => ({
          polls: s.polls.map((p) =>
            p.id === pollId ? { ...p, closed: !p.closed } : p,
          ),
        })),

      addNote: ({ title, content, color }) =>
        set((s) => ({
          notes: [
            {
              id: uid(),
              title,
              content,
              color: color ?? NOTE_COLORS[s.notes.length % NOTE_COLORS.length],
              pinned: false,
              authorId: s.currentUserId,
              updatedAt: new Date().toISOString(),
            },
            ...s.notes,
          ],
        })),

      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id
              ? { ...n, ...patch, updatedAt: new Date().toISOString() }
              : n,
          ),
        })),

      toggleNotePin: (id) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, pinned: !n.pinned } : n,
          ),
        })),

      removeNote: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      resetDemoData: () => set(initial()),
    }),
    {
      name: "teams-labo-state",
      version: SEED_VERSION,
    },
  ),
);
