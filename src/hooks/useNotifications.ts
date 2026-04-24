import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
} from "../lib/data/features";
import { notificationFromRow } from "../lib/data/adapters";
import type { AppNotification } from "../types";
import type { NotificationRow } from "../lib/data/types";

interface UseNotificationsResult {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markRead: (ids: string[]) => Promise<void>;
  markAllRead: () => Promise<void>;
}

/**
 * Subscribes to the current user's notifications row-set. Realtime INSERTs are
 * merged client-side; UPDATEs (read_at flips) are reconciled by id. Active team
 * scope is enforced client-side when the hook is remounted on team switch.
 */
export const useNotifications = (
  userId: string | null,
  teamId: string | null,
): UseNotificationsResult => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchNotifications(userId, teamId)
      .then((rows) => {
        if (!cancelled) {
          setItems(rows);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "failed to load notifications",
          );
          setLoading(false);
        }
      });

    // Realtime filter only supports a single field; filter by user_id in the
    // channel and discard cross-team rows client-side.
    const channel = supabase
      .channel(`notifications-${userId}-${teamId ?? "any"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotificationRow;
          if (teamId && row.team_id !== teamId) return;
          setItems((prev) => {
            if (prev.some((n) => n.id === row.id)) return prev;
            return [notificationFromRow(row), ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotificationRow;
          if (teamId && row.team_id !== teamId) return;
          setItems((prev) =>
            prev.map((n) => (n.id === row.id ? notificationFromRow(row) : n)),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.old as Partial<NotificationRow>;
          if (!row.id) return;
          setItems((prev) => prev.filter((n) => n.id !== row.id));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase?.removeChannel(channel);
    };
  }, [userId, teamId]);

  const unreadCount = useMemo(
    () => items.filter((n) => n.readAt === null).length,
    [items],
  );

  const markRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    // Optimistic update.
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((n) => (ids.includes(n.id) && !n.readAt ? { ...n, readAt: now } : n)),
    );
    try {
      await markNotificationsRead(ids);
    } catch (err) {
      console.error("teams-labo markNotificationsRead error", err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    try {
      await markAllNotificationsRead(teamId);
    } catch (err) {
      console.error("teams-labo markAllNotificationsRead error", err);
    }
  }, [teamId]);

  return { items, unreadCount, loading, error, markRead, markAllRead };
};
