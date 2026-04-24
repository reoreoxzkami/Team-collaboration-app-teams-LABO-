/** Supabase row shapes (mirror of SQL schema). */

export type DbTaskStatus = "todo" | "doing" | "review" | "done";
export type DbTaskPriority = "low" | "medium" | "high";
export type DbMemberStatus = "online" | "focus" | "away" | "offline";

export interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_emoji: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface TeamRow {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface TeamMemberRow {
  id: string;
  team_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  status: DbMemberStatus;
  current_mood_emoji: string;
  current_mood_note: string;
  mood_updated_at: string;
  joined_at: string;
}

export interface TaskRow {
  id: string;
  team_id: string;
  title: string;
  description: string;
  status: DbTaskStatus;
  priority: DbTaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface KudosRow {
  id: string;
  team_id: string;
  from_id: string;
  to_id: string;
  message: string;
  emoji: string;
  color: string;
  reactions: Record<string, string[]>;
  created_at: string;
}

export interface PollOptionRow {
  id: string;
  text: string;
}

export interface PollRow {
  id: string;
  team_id: string;
  question: string;
  options: PollOptionRow[];
  closed: boolean;
  created_by: string;
  created_at: string;
}

export interface PollVoteRow {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export interface NoteRow {
  id: string;
  team_id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  author_id: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type DbActivityKind =
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

export type DbNotificationKind =
  | "comment.mention"
  | "comment.on_assigned_task"
  | "task.assigned"
  | "kudos.received"
  | "poll.created";

export interface TaskCommentRow {
  id: string;
  team_id: string;
  task_id: string;
  author_id: string;
  body: string;
  mentions: string[];
  created_at: string;
  updated_at: string;
}

export interface ActivityEventRow {
  id: string;
  team_id: string;
  actor_id: string | null;
  kind: DbActivityKind;
  entity_type: string;
  entity_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  team_id: string;
  user_id: string;
  actor_id: string | null;
  kind: DbNotificationKind;
  entity_type: string;
  entity_id: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}
