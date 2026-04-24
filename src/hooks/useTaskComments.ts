import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  fetchTaskComments,
  insertTaskComment,
  deleteTaskComment,
} from "../lib/data/features";
import { taskCommentFromRow } from "../lib/data/adapters";
import type { TaskComment } from "../types";
import type { TaskCommentRow } from "../lib/data/types";

interface UseTaskCommentsResult {
  comments: TaskComment[];
  loading: boolean;
  error: string | null;
  add: (body: string, mentions: string[]) => Promise<void>;
  remove: (commentId: string) => Promise<void>;
}

/**
 * Loads task comments + subscribes to realtime INSERT/UPDATE/DELETE on
 * task_comments for the specified task. Server-authoritative (RPC parses
 * mentions and fans out notifications).
 */
export const useTaskComments = (taskId: string | null): UseTaskCommentsResult => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !taskId) {
      setComments([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchTaskComments(taskId)
      .then((rows) => {
        if (!cancelled) {
          setComments(rows);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "failed to load comments");
          setLoading(false);
        }
      });

    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "task_comments",
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          const row = payload.new as TaskCommentRow;
          setComments((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            return [...prev, taskCommentFromRow(row)];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "task_comments",
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          const row = payload.new as TaskCommentRow;
          setComments((prev) =>
            prev.map((c) => (c.id === row.id ? taskCommentFromRow(row) : c)),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "task_comments",
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          const row = payload.old as Partial<TaskCommentRow>;
          if (!row.id) return;
          setComments((prev) => prev.filter((c) => c.id !== row.id));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase?.removeChannel(channel);
    };
  }, [taskId]);

  const add = useCallback(
    async (body: string, mentions: string[]) => {
      if (!taskId) return;
      await insertTaskComment({ taskId, body, mentions });
    },
    [taskId],
  );

  const remove = useCallback(async (commentId: string) => {
    await deleteTaskComment(commentId);
  }, []);

  return { comments, loading, error, add, remove };
};
