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
