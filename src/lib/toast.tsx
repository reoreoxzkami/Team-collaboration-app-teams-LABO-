import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, XCircle, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

export type ToastKind = "success" | "error" | "warn" | "info";

interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  /** Auto-dismiss after this many ms. 0 or undefined = sticky. */
  timeout?: number;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = newId();
    set((s) => ({ toasts: [...s.toasts, { id, timeout: 3500, ...t }] }));
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Stable helpers — call from anywhere (stores, async handlers, etc.). */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ kind: "success", title, description }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ kind: "error", title, description, timeout: 5500 }),
  warn: (title: string, description?: string) =>
    useToastStore.getState().push({ kind: "warn", title, description }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ kind: "info", title, description }),
};

const KIND_STYLE: Record<ToastKind, { icon: ReactNode; accent: string; ring: string }> = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    accent: "from-emerald-500 to-teal-500",
    ring: "ring-emerald-500/30",
  },
  error: {
    icon: <XCircle className="h-5 w-5" />,
    accent: "from-rose-500 to-red-500",
    ring: "ring-rose-500/30",
  },
  warn: {
    icon: <TriangleAlert className="h-5 w-5" />,
    accent: "from-amber-500 to-orange-500",
    ring: "ring-amber-500/30",
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    accent: "from-sky-500 to-indigo-500",
    ring: "ring-sky-500/30",
  },
};

const Row = ({ t }: { t: Toast }) => {
  const dismiss = useToastStore((s) => s.dismiss);
  const style = KIND_STYLE[t.kind];
  useEffect(() => {
    if (!t.timeout) return;
    const h = window.setTimeout(() => dismiss(t.id), t.timeout);
    return () => window.clearTimeout(h);
  }, [t.id, t.timeout, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      className={`glass-panel pointer-events-auto flex min-w-[280px] max-w-sm items-start gap-3 p-3 ring-1 ${style.ring}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-glow ${style.accent}`}
      >
        {style.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold text-ink-primary">{t.title}</div>
        {t.description && (
          <div className="mt-0.5 text-xs text-ink-secondary">{t.description}</div>
        )}
      </div>
      <button
        onClick={() => dismiss(t.id)}
        className="flex-none rounded-lg p-1 text-ink-tertiary transition hover:bg-line/30 hover:text-ink-primary"
        aria-label="閉じる"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export const ToastHost = () => {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <Row key={t.id} t={t} />
        ))}
      </AnimatePresence>
    </div>
  );
};
