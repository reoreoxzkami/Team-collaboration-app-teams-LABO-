import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { fetchActivity } from "../lib/data/features";
import { activityFromRow } from "../lib/data/adapters";
import type { ActivityEvent } from "../types";
import type { ActivityEventRow } from "../lib/data/types";

/**
 * Subscribes to activity_events for the current team. Initial fetch + realtime
 * INSERTs are merged client-side (prepending new events so newest stays first).
 */
export const useActivity = (
  teamId: string | null,
  limit = 80,
): { events: ActivityEvent[]; loading: boolean; error: string | null } => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !teamId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchActivity(teamId, limit)
      .then((rows) => {
        if (!cancelled) {
          setEvents(rows);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "failed to load activity");
          setLoading(false);
        }
      });

    const channel = supabase
      .channel(`activity-${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_events",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          const row = payload.new as ActivityEventRow;
          setEvents((prev) => {
            // Realtime can occasionally double-deliver; dedupe by id.
            if (prev.some((e) => e.id === row.id)) return prev;
            return [activityFromRow(row), ...prev].slice(0, limit);
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase?.removeChannel(channel);
    };
  }, [teamId, limit]);

  return { events, loading, error };
};
