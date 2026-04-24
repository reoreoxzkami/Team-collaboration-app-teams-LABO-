import { supabase } from "../supabase";
import {
  activityFromRow,
  notificationFromRow,
  taskCommentFromRow,
} from "./adapters";
import type {
  ActivityEventRow,
  NotificationRow,
  TaskCommentRow,
} from "./types";
import type { ActivityEvent, AppNotification, TaskComment } from "../../types";

const must = () => {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
};

// ==================== Activity Feed ====================

export const fetchActivity = async (
  teamId: string,
  limit = 80,
): Promise<ActivityEvent[]> => {
  const sb = must();
  const { data, error } = await sb
    .from("activity_events")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as ActivityEventRow[]).map(activityFromRow);
};

// ==================== Notifications ====================

export const fetchNotifications = async (
  userId: string,
  limit = 50,
): Promise<AppNotification[]> => {
  const sb = must();
  const { data, error } = await sb
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as NotificationRow[]).map(notificationFromRow);
};

export const markNotificationsRead = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const sb = must();
  const { error } = await sb.rpc("mark_notifications_read", { p_ids: ids });
  if (error) throw error;
};

export const markAllNotificationsRead = async (): Promise<void> => {
  const sb = must();
  const { error } = await sb.rpc("mark_all_notifications_read");
  if (error) throw error;
};

// ==================== Task Comments ====================

export const fetchTaskComments = async (
  taskId: string,
): Promise<TaskComment[]> => {
  const sb = must();
  const { data, error } = await sb
    .from("task_comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as TaskCommentRow[]).map(taskCommentFromRow);
};

export const insertTaskComment = async (input: {
  taskId: string;
  body: string;
  mentions: string[];
}): Promise<TaskComment> => {
  const sb = must();
  const { data, error } = await sb.rpc("insert_task_comment", {
    p_task_id: input.taskId,
    p_body: input.body,
    p_mentions: input.mentions,
  });
  if (error) throw error;
  return taskCommentFromRow(data as TaskCommentRow);
};

export const deleteTaskComment = async (commentId: string): Promise<void> => {
  const sb = must();
  const { error } = await sb
    .from("task_comments")
    .delete()
    .eq("id", commentId);
  if (error) throw error;
};
