import { useEffect } from "react";
import { supabase } from "../supabase";
import { useStore } from "../../store";
import { fetchTeamSnapshot } from "./queries";

/**
 * Hydrates the Zustand store from Supabase and subscribes to realtime changes
 * for the active team. Keeps the store's `mode` / `activeTeamId` / `authUserId`
 * in sync, so mutations delegate to Supabase instead of local state.
 *
 * No-op when Supabase is unconfigured or teamId/userId are null.
 */
export const useCloudSync = (
  teamId: string | null,
  userId: string | null,
): void => {
  useEffect(() => {
    if (!supabase || !teamId || !userId) {
      useStore.getState().setCloudContext(null);
      return;
    }

    let cancelled = false;
    useStore.getState().setCloudContext({ teamId, userId });

    const refresh = async () => {
      if (!teamId) return;
      try {
        const snap = await fetchTeamSnapshot(teamId);
        if (cancelled) return;
        useStore.getState().hydrate({
          currentUserId: userId,
          ...snap,
        });
      } catch (err) {
        // Don't overwrite UI on transient errors; just log.
        console.error("teams-labo sync error", err);
      }
    };

    void refresh();

    const channel = supabase
      .channel(`team-${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `team_id=eq.${teamId}` },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kudos", filter: `team_id=eq.${teamId}` },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "polls", filter: `team_id=eq.${teamId}` },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes", filter: `team_id=eq.${teamId}` },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_members", filter: `team_id=eq.${teamId}` },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_votes" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        refresh,
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase?.removeChannel(channel);
      useStore.getState().setCloudContext(null);
    };
  }, [teamId, userId]);
};
