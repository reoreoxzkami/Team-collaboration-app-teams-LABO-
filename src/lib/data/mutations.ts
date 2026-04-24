import { supabase } from "../supabase";
import type { MemberStatus, TaskPriority, TaskStatus } from "../../types";
import type { PollOptionRow } from "./types";

const must = () => {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
};

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

// ===== profile / team_members =====

export const updateMyProfile = async (patch: {
  display_name?: string;
  avatar_emoji?: string;
  color?: string;
}) => {
  const sb = must();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error("not signed in");
  const { error } = await sb
    .from("profiles")
    .update(patch)
    .eq("id", auth.user.id);
  if (error) throw error;
};

export const updateMyTeamMember = async (
  teamId: string,
  patch: {
    status?: MemberStatus;
    current_mood_emoji?: string;
    current_mood_note?: string;
    mood_updated_at?: string;
  },
) => {
  const sb = must();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error("not signed in");
  const { error } = await sb
    .from("team_members")
    .update(patch)
    .eq("team_id", teamId)
    .eq("user_id", auth.user.id);
  if (error) throw error;
};

// ===== tasks =====

// Columns added by migration 0004. If that migration hasn't run yet Supabase
// returns error code 42703 ("column does not exist") or PostgREST's PGRST204
// ("schema cache"). We retry the write with these stripped so the app stays
// functional while the user applies the migration.
const TASK_OPTIONAL_COLS = ["due_date", "tags", "sort_order"] as const;

const isMissingColumnError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  if (e.code === "42703" || e.code === "PGRST204") return true;
  return typeof e.message === "string" && /column .* does not exist/i.test(e.message);
};

const stripOptional = <T extends Record<string, unknown>>(row: T): Partial<T> => {
  const out: Partial<T> = { ...row };
  for (const k of TASK_OPTIONAL_COLS) delete (out as Record<string, unknown>)[k];
  return out;
};

export const insertTask = async (input: {
  id?: string;
  team_id: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignee_id?: string | null;
  due_date?: string | null;
  tags?: string[];
  sort_order?: number;
}) => {
  const sb = must();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error("not signed in");
  const row = {
    ...(input.id ? { id: input.id } : {}),
    team_id: input.team_id,
    title: input.title,
    description: input.description ?? "",
    status: "todo" as TaskStatus,
    priority: input.priority ?? "medium",
    assignee_id: input.assignee_id ?? null,
    due_date: input.due_date ?? null,
    tags: input.tags ?? [],
    sort_order: input.sort_order ?? Date.now(),
    created_by: auth.user.id,
  };
  let { error } = await sb.from("tasks").insert(row);
  if (error && isMissingColumnError(error)) {
    ({ error } = await sb.from("tasks").insert(stripOptional(row)));
  }
  if (error) throw error;
};

export const updateTask = async (
  taskId: string,
  patch: Partial<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignee_id: string | null;
    due_date: string | null;
    tags: string[];
    sort_order: number;
  }>,
) => {
  const sb = must();
  let { error } = await sb.from("tasks").update(patch).eq("id", taskId);
  if (error && isMissingColumnError(error)) {
    const safe = stripOptional(patch as Record<string, unknown>);
    if (Object.keys(safe).length === 0) return;
    ({ error } = await sb.from("tasks").update(safe).eq("id", taskId));
  }
  if (error) throw error;
};

export const deleteTask = async (taskId: string) => {
  const sb = must();
  const { error } = await sb.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
};

/**
 * Atomically sets (status, sort_order) on a task via an RPC. Avoids a
 * read/modify/write race when multiple users reorder the same column.
 */
export const reorderTask = async (
  taskId: string,
  status: TaskStatus,
  sortOrder: number,
): Promise<void> => {
  const sb = must();
  const { error } = await sb.rpc("reorder_task", {
    p_task_id: taskId,
    p_status: status,
    p_sort_order: sortOrder,
  });
  if (error) throw error;
};

// ===== kudos =====

const randomFromArr = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const KUDOS_COLORS = [
  "from-pink-500 to-rose-500",
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
];

export const insertKudos = async (input: {
  id?: string;
  team_id: string;
  to_id: string;
  message: string;
  emoji: string;
  color?: string;
}) => {
  const sb = must();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error("not signed in");
  const { error } = await sb.from("kudos").insert({
    ...(input.id ? { id: input.id } : {}),
    team_id: input.team_id,
    from_id: auth.user.id,
    to_id: input.to_id,
    message: input.message,
    emoji: input.emoji,
    color: input.color ?? randomFromArr(KUDOS_COLORS),
    reactions: {},
  });
  if (error) throw error;
};

/**
 * Atomically toggles the caller's reaction to a kudos row via a server-side
 * RPC (see `supabase/migrations/0002_atomic_ops.sql`). Avoids the read /
 * modify / write race present when multiple users react concurrently.
 */
export const toggleKudosReaction = async (
  kudosId: string,
  emoji: string,
): Promise<void> => {
  const sb = must();
  const { error } = await sb.rpc("toggle_kudos_reaction", {
    p_kudos_id: kudosId,
    p_emoji: emoji,
  });
  if (error) throw error;
};

// ===== polls =====

export const insertPoll = async (input: {
  id?: string;
  team_id: string;
  question: string;
  options: Array<{ id: string; text: string }> | string[];
}) => {
  const sb = must();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error("not signed in");
  const options: PollOptionRow[] = input.options.map((o) =>
    typeof o === "string" ? { id: uuid(), text: o } : o,
  );
  const { error } = await sb.from("polls").insert({
    ...(input.id ? { id: input.id } : {}),
    team_id: input.team_id,
    question: input.question,
    options,
    closed: false,
    created_by: auth.user.id,
  });
  if (error) throw error;
};

export const togglePollClosed = async (pollId: string, closed: boolean) => {
  const sb = must();
  const { error } = await sb
    .from("polls")
    .update({ closed })
    .eq("id", pollId);
  if (error) throw error;
};

/** Cast (or switch) this user's vote on a poll. Enforces single-choice per user via unique (poll_id,user_id). */
export const castPollVote = async (pollId: string, optionId: string) => {
  const sb = must();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error("not signed in");

  // Check if user has existing vote on this option → toggle off.
  const { data: existing, error: selErr } = await sb
    .from("poll_votes")
    .select("id, option_id")
    .eq("poll_id", pollId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing && existing.option_id === optionId) {
    const { error } = await sb.from("poll_votes").delete().eq("id", existing.id);
    if (error) throw error;
    return;
  }

  // Switching to a different option: delete-then-insert so we don't rely on
  // an UPDATE RLS policy on poll_votes (which the schema intentionally
  // omits — votes are effectively immutable per (poll_id,user_id) pair and
  // changing a vote is modeled as remove+add).
  if (existing) {
    const { error: delErr } = await sb
      .from("poll_votes")
      .delete()
      .eq("id", existing.id);
    if (delErr) throw delErr;
  }

  const { error } = await sb.from("poll_votes").insert({
    poll_id: pollId,
    option_id: optionId,
    user_id: auth.user.id,
  });
  if (error) throw error;
};

// ===== notes =====

export const insertNote = async (input: {
  id?: string;
  team_id: string;
  title: string;
  content: string;
  color: string;
}) => {
  const sb = must();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error("not signed in");
  const { error } = await sb.from("notes").insert({
    ...(input.id ? { id: input.id } : {}),
    team_id: input.team_id,
    title: input.title,
    content: input.content,
    color: input.color,
    pinned: false,
    author_id: auth.user.id,
  });
  if (error) throw error;
};

export const updateNote = async (
  noteId: string,
  patch: Partial<{ title: string; content: string; color: string; pinned: boolean }>,
) => {
  const sb = must();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error("not signed in");
  const updates = {
    ...patch,
    updated_at: new Date().toISOString(),
    updated_by: auth.user.id,
  };
  const { error } = await sb.from("notes").update(updates).eq("id", noteId);
  if (error) throw error;
};

export const deleteNote = async (noteId: string) => {
  const sb = must();
  const { error } = await sb.from("notes").delete().eq("id", noteId);
  if (error) throw error;
};
