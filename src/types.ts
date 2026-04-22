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
  | "members"
  | "tasks"
  | "kudos"
  | "mood"
  | "polls"
  | "notes";
