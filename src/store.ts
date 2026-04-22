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
import {
  castPollVote,
  deleteNote,
  deleteTask,
  insertKudos,
  insertNote,
  insertPoll,
  insertTask,
  toggleKudosReaction as cloudToggleKudosReaction,
  togglePollClosed,
  updateNote as cloudUpdateNote,
  updateMyProfile,
  updateMyTeamMember,
  updateTask as cloudUpdateTask,
} from "./lib/data/mutations";

interface CloudContext {
  teamId: string;
  userId: string;
}

interface Snapshot {
  currentUserId: string;
  members: Member[];
  tasks: Task[];
  kudos: Kudos[];
  polls: Poll[];
  notes: Note[];
}

interface AppState {
  version: number;
  currentUserId: string;
  members: Member[];
  tasks: Task[];
  kudos: Kudos[];
  polls: Poll[];
  notes: Note[];
  /** User has dismissed demo members (content demo items clear automatically). */
  demoMembersDismissed: boolean;

  /** When set, mutations write to Supabase instead of local state. */
  cloud: CloudContext | null;

  setCurrentUser: (id: string) => void;

  /** Switches to cloud mode (or back to local when null). */
  setCloudContext: (ctx: CloudContext | null) => void;
  /** Replace all data arrays from a Supabase snapshot. */
  hydrate: (snap: Snapshot) => void;

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

  /** Clear demo content (tasks/kudos/polls/notes). Keeps demo members. */
  clearDemoContent: () => void;
  /** Dismiss demo members as well (after this, currentUser may need resetting). */
  dismissDemoMembers: () => void;
  /** Restore full seed data (used by Reset button, local mode only). */
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
  demoMembersDismissed: false,
  cloud: null as CloudContext | null,
});

/** Strip demo items from content arrays (keeps members intact). */
const stripDemoContent = (s: {
  tasks: Task[];
  kudos: Kudos[];
  polls: Poll[];
  notes: Note[];
}) => ({
  tasks: s.tasks.filter((t) => !t.isDemo),
  kudos: s.kudos.filter((k) => !k.isDemo),
  polls: s.polls.filter((p) => !p.isDemo),
  notes: s.notes.filter((n) => !n.isDemo),
});

const logCloudError = (label: string) => (err: unknown) => {
  console.error(`teams-labo ${label}`, err);
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial(),

      setCurrentUser: (id) => {
        if (get().cloud) return; // In cloud mode, current user is the signed-in user.
        set({ currentUserId: id });
      },

      setCloudContext: (ctx) => {
        const prev = get().cloud;
        if (prev?.teamId === ctx?.teamId && prev?.userId === ctx?.userId) return;
        set({ cloud: ctx });
      },

      hydrate: (snap) =>
        set({
          currentUserId: snap.currentUserId,
          members: snap.members,
          tasks: snap.tasks,
          kudos: snap.kudos,
          polls: snap.polls,
          notes: snap.notes,
          demoMembersDismissed: true,
        }),

      updateMember: (id, patch) => {
        const s = get();
        if (s.cloud) {
          if (id !== s.cloud.userId) return; // can only update self in cloud mode
          const profilePatch: {
            display_name?: string;
            avatar_emoji?: string;
            color?: string;
          } = {};
          if (patch.name !== undefined) profilePatch.display_name = patch.name;
          if (patch.emoji !== undefined) profilePatch.avatar_emoji = patch.emoji;
          if (patch.color !== undefined) profilePatch.color = patch.color;
          if (Object.keys(profilePatch).length > 0) {
            updateMyProfile(profilePatch).catch(logCloudError("updateMyProfile"));
          }
          const tmPatch: {
            status?: MemberStatus;
            current_mood_emoji?: string;
            current_mood_note?: string;
          } = {};
          if (patch.status !== undefined) tmPatch.status = patch.status;
          if (patch.mood !== undefined) tmPatch.current_mood_emoji = patch.mood;
          if (patch.moodNote !== undefined) tmPatch.current_mood_note = patch.moodNote;
          if (Object.keys(tmPatch).length > 0) {
            updateMyTeamMember(s.cloud.teamId, tmPatch).catch(
              logCloudError("updateMyTeamMember"),
            );
          }
          return;
        }
        set((s) => ({
          members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        }));
      },

      setMemberStatus: (id, status) => {
        const s = get();
        if (s.cloud && id !== s.cloud.userId) return;
        set((s) => ({
          members: s.members.map((m) =>
            m.id === id ? { ...m, status } : m,
          ),
        }));
        if (s.cloud) {
          updateMyTeamMember(s.cloud.teamId, { status }).catch(
            logCloudError("setMemberStatus"),
          );
        }
      },

      setMemberMood: (id, mood, moodNote) => {
        const s = get();
        if (s.cloud && id !== s.cloud.userId) return;
        const now = new Date().toISOString();
        set((s) => ({
          members: s.members.map((m) =>
            m.id === id
              ? { ...m, mood, moodNote, moodUpdatedAt: now }
              : m,
          ),
        }));
        if (s.cloud) {
          updateMyTeamMember(s.cloud.teamId, {
            current_mood_emoji: mood,
            current_mood_note: moodNote,
            mood_updated_at: now,
          }).catch(logCloudError("setMemberMood"));
        }
      },

      addTask: ({ title, description, assigneeId, priority }) => {
        const s = get();
        const id = uid();
        // Optimistic: add locally in both modes.
        set((s) => ({
          ...(s.cloud ? {} : stripDemoContent(s)),
          tasks: [
            {
              id,
              title,
              description: description ?? "",
              status: "todo",
              assigneeId: assigneeId ?? null,
              priority: priority ?? "medium",
              dueDate: null,
              createdAt: new Date().toISOString(),
            },
            ...(s.cloud ? s.tasks : s.tasks.filter((t) => !t.isDemo)),
          ],
        }));
        if (s.cloud) {
          insertTask({
            id,
            team_id: s.cloud.teamId,
            title,
            description,
            priority,
            assignee_id: assigneeId ?? null,
          }).catch(logCloudError("insertTask"));
        }
      },

      updateTaskStatus: (id, status) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
        }));
        if (get().cloud) {
          cloudUpdateTask(id, { status }).catch(logCloudError("updateTaskStatus"));
        }
      },

      updateTask: (id, patch) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }));
        if (get().cloud) {
          const dbPatch: Parameters<typeof cloudUpdateTask>[1] = {};
          if (patch.title !== undefined) dbPatch.title = patch.title;
          if (patch.description !== undefined) dbPatch.description = patch.description;
          if (patch.status !== undefined) dbPatch.status = patch.status;
          if (patch.priority !== undefined) dbPatch.priority = patch.priority;
          if (patch.assigneeId !== undefined) dbPatch.assignee_id = patch.assigneeId;
          if (patch.dueDate !== undefined) dbPatch.due_date = patch.dueDate;
          cloudUpdateTask(id, dbPatch).catch(logCloudError("updateTask"));
        }
      },

      removeTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
        if (get().cloud) {
          deleteTask(id).catch(logCloudError("removeTask"));
        }
      },

      addKudos: ({ toId, message, emoji }) => {
        const s = get();
        const id = uid();
        const color =
          KUDOS_COLORS[Math.floor(Math.random() * KUDOS_COLORS.length)];
        set((s) => ({
          ...(s.cloud ? {} : stripDemoContent(s)),
          kudos: [
            {
              id,
              fromId: s.currentUserId,
              toId,
              message,
              emoji,
              color,
              createdAt: new Date().toISOString(),
              reactions: {},
            },
            ...(s.cloud ? s.kudos : s.kudos.filter((k) => !k.isDemo)),
          ],
        }));
        if (s.cloud) {
          insertKudos({
            id,
            team_id: s.cloud.teamId,
            to_id: toId,
            message,
            emoji,
            color,
          }).catch(logCloudError("insertKudos"));
        }
      },

      toggleKudosReaction: (kudosId, emoji) => {
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
        });
        if (get().cloud) {
          cloudToggleKudosReaction(kudosId, emoji).catch(
            logCloudError("toggleKudosReaction"),
          );
        }
      },

      addPoll: ({ question, options }) => {
        const s = get();
        const id = uid();
        const optionObjs = options
          .filter((o) => o.trim().length > 0)
          .map((text) => ({ id: uid(), text, votes: [] as string[] }));
        set((s) => ({
          ...(s.cloud ? {} : stripDemoContent(s)),
          polls: [
            {
              id,
              question,
              options: optionObjs,
              createdAt: new Date().toISOString(),
              closed: false,
              createdById: s.currentUserId,
            },
            ...(s.cloud ? s.polls : s.polls.filter((p) => !p.isDemo)),
          ],
        }));
        if (s.cloud) {
          insertPoll({
            id,
            team_id: s.cloud.teamId,
            question,
            options: optionObjs.map((o) => ({ id: o.id, text: o.text })),
          }).catch(logCloudError("insertPoll"));
        }
      },

      voteOnPoll: (pollId, optionId) => {
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
        });
        if (get().cloud) {
          castPollVote(pollId, optionId).catch(logCloudError("voteOnPoll"));
        }
      },

      closePoll: (pollId) => {
        const poll = get().polls.find((p) => p.id === pollId);
        if (!poll) return;
        const next = !poll.closed;
        set((s) => ({
          polls: s.polls.map((p) =>
            p.id === pollId ? { ...p, closed: next } : p,
          ),
        }));
        if (get().cloud) {
          togglePollClosed(pollId, next).catch(logCloudError("closePoll"));
        }
      },

      addNote: ({ title, content, color }) => {
        const s = get();
        const id = uid();
        const resolvedColor =
          color ?? NOTE_COLORS[s.notes.length % NOTE_COLORS.length];
        set((s) => ({
          ...(s.cloud ? {} : stripDemoContent(s)),
          notes: [
            {
              id,
              title,
              content,
              color: resolvedColor,
              pinned: false,
              authorId: s.currentUserId,
              updatedAt: new Date().toISOString(),
            },
            ...(s.cloud ? s.notes : s.notes.filter((n) => !n.isDemo)),
          ],
        }));
        if (s.cloud) {
          insertNote({
            id,
            team_id: s.cloud.teamId,
            title,
            content,
            color: resolvedColor,
          }).catch(logCloudError("insertNote"));
        }
      },

      updateNote: (id, patch) => {
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id
              ? { ...n, ...patch, updatedAt: new Date().toISOString() }
              : n,
          ),
        }));
        if (get().cloud) {
          cloudUpdateNote(id, {
            ...(patch.title !== undefined ? { title: patch.title } : {}),
            ...(patch.content !== undefined ? { content: patch.content } : {}),
            ...(patch.color !== undefined ? { color: patch.color } : {}),
            ...(patch.pinned !== undefined ? { pinned: patch.pinned } : {}),
          }).catch(logCloudError("updateNote"));
        }
      },

      toggleNotePin: (id) => {
        const note = get().notes.find((n) => n.id === id);
        if (!note) return;
        const next = !note.pinned;
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, pinned: next } : n)),
        }));
        if (get().cloud) {
          cloudUpdateNote(id, { pinned: next }).catch(
            logCloudError("toggleNotePin"),
          );
        }
      },

      removeNote: (id) => {
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
        if (get().cloud) {
          deleteNote(id).catch(logCloudError("removeNote"));
        }
      },

      clearDemoContent: () =>
        set((s) => ({
          ...stripDemoContent(s),
        })),

      dismissDemoMembers: () =>
        set((s) => {
          const realMembers = s.members.filter((m) => !m.isDemo);
          const nextCurrent =
            realMembers.find((m) => m.id === s.currentUserId)?.id ??
            realMembers[0]?.id ??
            "";
          return {
            members: realMembers,
            currentUserId: nextCurrent,
            demoMembersDismissed: true,
          };
        }),

      resetDemoData: () => {
        if (get().cloud) return; // no-op in cloud mode
        set(initial());
      },
    }),
    {
      name: "teams-labo-state",
      version: SEED_VERSION,
      partialize: (s) => ({
        // Don't persist cloud context (rebuilt on sign-in).
        version: s.version,
        currentUserId: s.currentUserId,
        members: s.members,
        tasks: s.tasks,
        kudos: s.kudos,
        polls: s.polls,
        notes: s.notes,
        demoMembersDismissed: s.demoMembersDismissed,
      }),
    },
  ),
);
