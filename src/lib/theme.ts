import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "teams-labo-theme";

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const readStoredTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" || v === "system" ? v : "system";
};

export const resolveTheme = (mode: ThemeMode): "light" | "dark" =>
  mode === "system" ? getSystemTheme() : mode;

export const applyTheme = (mode: ThemeMode) => {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(mode);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolved === "dark" ? "#0b0f1a" : "#7c3aed");
  }
};

// ---- Module-level shared store ---------------------------------------------
// useTheme is invoked from multiple components (App, ThemeToggle in Header,
// ThemeToggle on LoginPage). Each call must observe the same mode, otherwise
// stale system-preference listeners can flip the theme after the user has
// explicitly chosen light/dark.

type Listener = (mode: ThemeMode) => void;

let currentMode: ThemeMode = readStoredTheme();
const listeners = new Set<Listener>();
let mediaListenerBound = false;

const bindSystemListener = () => {
  if (mediaListenerBound || typeof window === "undefined") return;
  const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!mql) return;
  mediaListenerBound = true;
  mql.addEventListener("change", () => {
    if (currentMode === "system") applyTheme("system");
  });
};

const setModeShared = (mode: ThemeMode) => {
  currentMode = mode;
  applyTheme(mode);
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
  } catch {
    // private-mode or disabled storage → best-effort only
  }
  listeners.forEach((l) => l(mode));
};

// Initial paint sync (flash-of-wrong-theme prevention in index.html
// already handles the .dark class, but we still need theme-color meta etc.)
if (typeof document !== "undefined") {
  applyTheme(currentMode);
  bindSystemListener();
}

export const useTheme = () => {
  const [mode, setLocal] = useState<ThemeMode>(currentMode);

  useEffect(() => {
    bindSystemListener();
    const l: Listener = (m) => setLocal(m);
    listeners.add(l);
    // Resync in case store changed between render and effect.
    if (currentMode !== mode) setLocal(currentMode);
    return () => {
      listeners.delete(l);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMode = useCallback((m: ThemeMode) => setModeShared(m), []);
  const toggle = useCallback(() => {
    const now = resolveTheme(currentMode);
    setModeShared(now === "dark" ? "light" : "dark");
  }, []);

  return { mode, resolved: resolveTheme(mode), setMode, toggle };
};
