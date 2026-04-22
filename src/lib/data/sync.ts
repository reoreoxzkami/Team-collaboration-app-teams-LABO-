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

    // Trailing-edge debounce: coalesce bursts of realtime events (e.g. closing
    // a poll yields poll update + many poll_votes events) into a single
    // refetch fired once the burst has settled.
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(async () => {
        refreshTimer = null;
        if (cancelled || !teamId) return;
        try {
          const snap = await fetchTeamSnapshot(teamId);
          if (cancelled) return;
          useStore.getState().hydrate({ currentUserId: userId, ...snap });
        } catch (err) {
          // Don't overwrite UI on transient errors; just log.
          console.error("teams-labo sync error", err);
        }
      }, 200);
    };

    // Initial hydration with bounded retry. Without this, a transient network
    // blip would leave the HydrationGate stuck on the loading shell forever
    // (it's gated on `cloudHydrated`, which is only flipped by `hydrate()`).
    (async () => {
      const maxAttempts = 4;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (cancelled) return;
        try {
          const snap = await fetchTeamSnapshot(teamId);
          if (cancelled) return;
          useStore.getState().hydrate({ currentUserId: userId, ...snap });
          return;
        } catch (err) {
          console.error(
            `teams-labo initial sync error (attempt ${attempt}/${maxAttempts})`,
            err,
          );
          if (attempt === maxAttempts) {
            if (cancelled) return;
            const msg =
              err instanceof Error ? err.message : "Supabase への接続に失敗しました";
            useStore.getState().setCloudError(msg);
            return;
          }
          const delayMs = 400 * 2 ** (attempt - 1); // 400ms, 800ms, 1600ms
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    })();

    /**
     * Returns true if `id` belongs to a member of the currently active team.
     * Used to skip refetches for profiles / poll_votes in other teams, which
     * can't be filtered server-side because those tables aren't team-scoped.
     */
    const isCurrentTeamMember = (id: string | undefined): boolean => {
      if (!id) return false;
      return useStore.getState().members.some((m) => m.id === id);
    };
    const isCurrentTeamPoll = (pollId: string | undefined): boolean => {
      if (!pollId) return false;
      return useStore.getState().polls.some((p) => p.id === pollId);
    };

    type ProfilePayload = {
      new?: { id?: string };
      old?: { id?: string };
    };
    type VotePayload = {
      new?: { poll_id?: string };
      old?: { poll_id?: string };
    };

    const channel = supabase
      .channel(`team-${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `team_id=eq.${teamId}` },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kudos", filter: `team_id=eq.${teamId}` },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "polls", filter: `team_id=eq.${teamId}` },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes", filter: `team_id=eq.${teamId}` },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_members", filter: `team_id=eq.${teamId}` },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_votes" },
        (payload) => {
          const p = payload as unknown as VotePayload;
          const pollId = p.new?.poll_id ?? p.old?.poll_id;
          if (isCurrentTeamPoll(pollId)) scheduleRefresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          const p = payload as unknown as ProfilePayload;
          const id = p.new?.id ?? p.old?.id;
          if (isCurrentTeamMember(id)) scheduleRefresh();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase?.removeChannel(channel);
      useStore.getState().setCloudContext(null);
    };
  }, [teamId, userId]);
};
