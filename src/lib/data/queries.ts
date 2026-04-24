import { supabase } from "../supabase";
import {
  kudosFromRow,
  memberFromJoin,
  noteFromRow,
  pollFromRow,
  taskFromRow,
} from "./adapters";
import type {
  KudosRow,
  NoteRow,
  PollRow,
  PollVoteRow,
  ProfileRow,
  TaskRow,
  TeamMemberRow,
} from "./types";
import type { Kudos, Member, Note, Poll, Task } from "../../types";

interface TeamSnapshot {
  members: Member[];
  tasks: Task[];
  kudos: Kudos[];
  polls: Poll[];
  notes: Note[];
}

const must = () => {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
};

export const fetchTeamSnapshot = async (
  teamId: string,
): Promise<TeamSnapshot> => {
  const sb = must();

  // First fetch team_members + polls + other team-scoped tables in parallel.
  const [membersRes, tasksRes, kudosRes, pollsRes, notesRes] = await Promise.all([
    sb.from("team_members").select("*").eq("team_id", teamId),
    // NOTE: we intentionally do NOT order by `sort_order` here. When migration
    // 0004 has not yet been applied that column doesn't exist and the entire
    // snapshot fetch would fail, breaking the app for every user. We sort by
    // `created_at` server-side and re-sort by `sortOrder` client-side after
    // adaptation (taskFromRow defaults sortOrder to 0 when the column is
    // missing, so ordering gracefully degrades to created_at).
    sb
      .from("tasks")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false }),
    sb
      .from("kudos")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false }),
    sb
      .from("polls")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false }),
    sb
      .from("notes")
      .select("*")
      .eq("team_id", teamId)
      .order("updated_at", { ascending: false }),
  ]);

  for (const r of [membersRes, tasksRes, kudosRes, pollsRes, notesRes]) {
    if (r.error) throw r.error;
  }

  const teamMembers = (membersRes.data ?? []) as TeamMemberRow[];
  const pollRows = (pollsRes.data ?? []) as PollRow[];

  // Now fetch only the profiles and poll_votes that belong to this team.
  const memberIds = teamMembers.map((m) => m.user_id);
  const pollIds = pollRows.map((p) => p.id);

  const [profilesRes, votesRes] = await Promise.all([
    memberIds.length > 0
      ? sb.from("profiles").select("*").in("id", memberIds)
      : Promise.resolve({ data: [] as ProfileRow[], error: null }),
    pollIds.length > 0
      ? sb.from("poll_votes").select("*").in("poll_id", pollIds)
      : Promise.resolve({ data: [] as PollVoteRow[], error: null }),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (votesRes.error) throw votesRes.error;

  const profileById = new Map<string, ProfileRow>(
    ((profilesRes.data ?? []) as ProfileRow[]).map((p) => [p.id, p]),
  );

  const members = teamMembers.map((tm) =>
    memberFromJoin(tm, profileById.get(tm.user_id) ?? null),
  );

  const tasks = ((tasksRes.data ?? []) as TaskRow[])
    .map(taskFromRow)
    .sort((a, b) => {
      if (b.sortOrder !== a.sortOrder) return b.sortOrder - a.sortOrder;
      return b.createdAt.localeCompare(a.createdAt);
    });
  const kudos = ((kudosRes.data ?? []) as KudosRow[]).map(kudosFromRow);
  const votes = (votesRes.data ?? []) as PollVoteRow[];
  const polls = pollRows.map((p) => pollFromRow(p, votes));
  const notes = ((notesRes.data ?? []) as NoteRow[]).map(noteFromRow);

  return { members, tasks, kudos, polls, notes };
};

export const fetchMyProfile = async () => {
  const sb = must();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .single();
  if (error) throw error;
  return data as ProfileRow;
};
