import { useEffect, useRef } from "react";
import type { View } from "../types";

export interface Shortcut {
  /** Display text, e.g. "?" or "⌘K" or "g d". */
  keys: string[];
  /** Human-readable description. */
  label: string;
  /** Optional section header in the cheatsheet modal. */
  section?: string;
}

/** Static catalog used by the ? cheatsheet modal. */
export const SHORTCUT_CATALOG: Shortcut[] = [
  { keys: ["⌘", "K"], label: "コマンドパレットを開く", section: "グローバル" },
  { keys: ["?"], label: "このショートカット一覧", section: "グローバル" },
  { keys: ["Esc"], label: "モーダル / パレットを閉じる", section: "グローバル" },
  { keys: ["g", "d"], label: "Dashboard へ移動", section: "ナビゲーション" },
  { keys: ["g", "a"], label: "Activity へ移動", section: "ナビゲーション" },
  { keys: ["g", "t"], label: "Task Board へ移動", section: "ナビゲーション" },
  { keys: ["g", "k"], label: "Kudos Wall へ移動", section: "ナビゲーション" },
  { keys: ["g", "m"], label: "Mood Check-in へ移動", section: "ナビゲーション" },
  { keys: ["g", "p"], label: "Polls へ移動", section: "ナビゲーション" },
  { keys: ["g", "n"], label: "Notes へ移動", section: "ナビゲーション" },
  { keys: ["g", "u"], label: "Members へ移動", section: "ナビゲーション" },
  { keys: ["n"], label: "新規タスクに集中（タスクボード上）", section: "タスク" },
];

const NAV_VIEWS: Record<string, View> = {
  d: "dashboard",
  a: "activity",
  t: "tasks",
  k: "kudos",
  m: "mood",
  p: "polls",
  n: "notes",
  u: "members",
};

interface HotkeyHandlers {
  onOpenPalette: () => void;
  onOpenCheatsheet: () => void;
  onNavigate: (view: View) => void;
  onFocusNewTask?: () => void;
}

const isEditable = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return el.isContentEditable;
};

/**
 * Global hotkey listener. Handles:
 *  - ⌘K / Ctrl+K: command palette
 *  - ?: cheatsheet
 *  - g <letter>: navigation combos (1s timeout)
 *  - n: focus new task input (only when handler provided)
 */
export const useGlobalHotkeys = (handlers: HotkeyHandlers): void => {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let leader: "g" | null = null;
    let leaderTimer: number | null = null;
    const clearLeader = () => {
      leader = null;
      if (leaderTimer) {
        window.clearTimeout(leaderTimer);
        leaderTimer = null;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const h = handlersRef.current;

      // ⌘K / Ctrl+K works even inside inputs.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        h.onOpenPalette();
        return;
      }

      // When typing in an editable field, ignore single-letter hotkeys.
      if (isEditable(e.target)) return;

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        h.onOpenCheatsheet();
        return;
      }

      if (leader === "g") {
        const view = NAV_VIEWS[e.key.toLowerCase()];
        clearLeader();
        if (view) {
          e.preventDefault();
          h.onNavigate(view);
        }
        return;
      }

      if (e.key.toLowerCase() === "g") {
        leader = "g";
        leaderTimer = window.setTimeout(clearLeader, 1200);
        return;
      }

      if (e.key.toLowerCase() === "n" && h.onFocusNewTask) {
        e.preventDefault();
        h.onFocusNewTask();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (leaderTimer) window.clearTimeout(leaderTimer);
    };
  }, []);
};
