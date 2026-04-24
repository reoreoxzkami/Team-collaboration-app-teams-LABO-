import { useEffect, useState, useCallback } from "react";

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

export const useTheme = () => {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredTheme());

  useEffect(() => {
    applyTheme(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const toggle = useCallback(
    () =>
      setModeState((prev) => {
        const now = resolveTheme(prev);
        return now === "dark" ? "light" : "dark";
      }),
    [],
  );

  return { mode, resolved: resolveTheme(mode), setMode, toggle };
};
