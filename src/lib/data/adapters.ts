import type {
  ActivityEvent,
  AppNotification,
  Kudos,
  Member,
  Note,
  Poll,
  Task,
  TaskComment,
} from "../../types";
import type {
  ActivityEventRow,
  KudosRow,
  NoteRow,
  NotificationRow,
  PollRow,
  PollVoteRow,
  ProfileRow,
  TaskCommentRow,
  TaskRow,
  TeamMemberRow,
} from "./types";

const MEMBER_GRADIENTS = [
  "from-pink-400 to-rose-500",
  "from-violet-400 to-fuchsia-500",
  "from-sky-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-blue-500",
  "from-lime-400 to-emerald-500",
  "from-rose-400 to-pink-500",
];

const hashIndex = (id: string, mod: number) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
};

export const memberFromJoin = (
  tm: TeamMemberRow,
  profile: ProfileRow | null,
): Member => {
  const color =
    profile?.color && profile.color.startsWith("from-")
      ? profile.color
      : MEMBER_GRADIENTS[hashIndex(tm.user_id, MEMBER_GRADIENTS.length)];
  return {
    id: tm.user_id,
    name: profile?.display_name || "名無しさん",
    role: tm.role === "owner" ? "オーナー" : tm.role === "admin" ? "管理者" : "メンバー",
    color,
    emoji: profile?.avatar_emoji || "🙂",
    status: tm.status,
    mood: tm.current_mood_emoji,
    moodNote: tm.current_mood_note,
    moodUpdatedAt: tm.mood_updated_at,
  };
};

export const taskFromRow = (r: TaskRow): Task => ({
  id: r.id,
  title: r.title,
  description: r.description,
  status: r.status,
  assigneeId: r.assignee_id,
  priority: r.priority,
  dueDate: r.due_date,
  tags: r.tags ?? [],
  sortOrder: typeof r.sort_order === "number" ? r.sort_order : 0,
  createdAt: r.created_at,
});

export const kudosFromRow = (r: KudosRow): Kudos => ({
  id: r.id,
  fromId: r.from_id,
  toId: r.to_id,
  message: r.message,
  emoji: r.emoji,
  color: r.color,
  createdAt: r.created_at,
  reactions: r.reactions ?? {},
});

export const pollFromRow = (r: PollRow, votes: PollVoteRow[]): Poll => {
  const byOption: Record<string, string[]> = {};
  for (const v of votes) {
    if (v.poll_id !== r.id) continue;
    (byOption[v.option_id] ??= []).push(v.user_id);
  }
  return {
    id: r.id,
    question: r.question,
    options: r.options.map((o) => ({
      id: o.id,
      text: o.text,
      votes: byOption[o.id] ?? [],
    })),
    createdAt: r.created_at,
    closed: r.closed,
    createdById: r.created_by,
  };
};

export const noteFromRow = (r: NoteRow): Note => ({
  id: r.id,
  title: r.title,
  content: r.content,
  color: r.color,
  pinned: r.pinned,
  authorId: r.author_id,
  updatedAt: r.updated_at,
});

export const activityFromRow = (r: ActivityEventRow): ActivityEvent => ({
  id: r.id,
  actorId: r.actor_id,
  kind: r.kind,
  entityType: r.entity_type,
  entityId: r.entity_id,
  payload: r.payload ?? {},
  createdAt: r.created_at,
});

export const notificationFromRow = (r: NotificationRow): AppNotification => ({
  id: r.id,
  kind: r.kind,
  actorId: r.actor_id,
  entityType: r.entity_type,
  entityId: r.entity_id,
  payload: r.payload ?? {},
  readAt: r.read_at,
  createdAt: r.created_at,
});

export const taskCommentFromRow = (r: TaskCommentRow): TaskComment => ({
  id: r.id,
  taskId: r.task_id,
  authorId: r.author_id,
  body: r.body,
  mentions: r.mentions ?? [],
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
