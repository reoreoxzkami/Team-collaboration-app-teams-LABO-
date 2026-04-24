export type MemberStatus = "online" | "focus" | "away" | "offline";

export interface Member {
  id: string;
  name: string;
  role: string;
  color: string;
  emoji: string;
  status: MemberStatus;
  mood: string;
  moodNote: string;
  moodUpdatedAt: string;
  isDemo?: boolean;
}

export type TaskStatus = "todo" | "doing" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
  sortOrder: number;
  createdAt: string;
  isDemo?: boolean;
}

export interface Kudos {
  id: string;
  fromId: string;
  toId: string;
  message: string;
  emoji: string;
  color: string;
  createdAt: string;
  reactions: Record<string, string[]>;
  isDemo?: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: string;
  closed: boolean;
  createdById: string;
  isDemo?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  authorId: string;
  updatedAt: string;
  isDemo?: boolean;
}

export type View =
  | "dashboard"
  | "activity"
  | "members"
  | "tasks"
  | "kudos"
  | "mood"
  | "polls"
  | "notes";

export type ActivityKind =
  | "task.created"
  | "task.status_changed"
  | "task.assignee_changed"
  | "task.deleted"
  | "comment.created"
  | "kudos.created"
  | "poll.created"
  | "poll.closed"
  | "note.created"
  | "member.joined"
  | "member.mood_updated";

export interface ActivityEvent {
  id: string;
  actorId: string | null;
  kind: ActivityKind;
  entityType: string;
  entityId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export type NotificationKind =
  | "comment.mention"
  | "comment.on_assigned_task"
  | "task.assigned"
  | "kudos.received"
  | "poll.created";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  actorId: string | null;
  entityType: string;
  entityId: string | null;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
}
