import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { SHORTCUT_CATALOG } from "../lib/shortcuts";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ShortcutCheatsheet = ({ open, onClose }: Props) => {
  const bySection = SHORTCUT_CATALOG.reduce<
    Record<string, typeof SHORTCUT_CATALOG>
  >((acc, s) => {
    const key = s.section ?? "その他";
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-primary/30 p-4 backdrop-blur-sm dark:bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="キーボードショートカット"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="glass-panel relative max-h-[80vh] w-full max-w-2xl overflow-y-auto p-6"
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-ink-tertiary transition hover:bg-line/30 hover:text-ink-primary"
              aria-label="閉じる"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-glow">
                <Keyboard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-extrabold text-ink-primary">
                  キーボードショートカット
                </h2>
                <p className="text-xs text-ink-secondary">
                  <kbd className="kbd">?</kbd> をいつでも押して呼び出せます。
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {Object.entries(bySection).map(([section, items]) => (
                <section key={section}>
                  <div className="eyebrow mb-2 text-brand-600">{section}</div>
                  <ul className="space-y-1.5">
                    {items.map((s) => (
                      <li
                        key={s.label}
                        className="flex items-center justify-between gap-3 rounded-xl border border-line/60 bg-surface-raised/60 px-3 py-2"
                      >
                        <span className="text-xs text-ink-secondary">{s.label}</span>
                        <span className="flex gap-1">
                          {s.keys.map((k, i) => (
                            <kbd key={i} className="kbd">
                              {k}
                            </kbd>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
