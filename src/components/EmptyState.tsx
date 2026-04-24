import type { ReactNode } from "react";

type Art = "tasks" | "kudos" | "notes" | "polls" | "activity" | "generic";

const ArtSvg = ({ kind }: { kind: Art }) => {
  switch (kind) {
    case "tasks":
      return (
        <svg viewBox="0 0 200 140" className="h-28 w-auto" aria-hidden>
          <defs>
            <linearGradient id="es-tasks" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--es-a, #6366f1)" />
              <stop offset="100%" stopColor="var(--es-b, #ec4899)" />
            </linearGradient>
          </defs>
          <rect x="22" y="26" width="70" height="90" rx="14" fill="url(#es-tasks)" opacity="0.18" />
          <rect x="34" y="44" width="46" height="8" rx="4" fill="url(#es-tasks)" />
          <rect x="34" y="60" width="38" height="6" rx="3" fill="url(#es-tasks)" opacity="0.55" />
          <rect x="34" y="72" width="30" height="6" rx="3" fill="url(#es-tasks)" opacity="0.35" />
          <rect x="108" y="18" width="70" height="90" rx="14" fill="url(#es-tasks)" opacity="0.32" />
          <path
            d="M120 58 l8 8 l20 -22"
            stroke="url(#es-tasks)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="172" cy="28" r="6" fill="url(#es-tasks)" />
        </svg>
      );
    case "kudos":
      return (
        <svg viewBox="0 0 200 140" className="h-28 w-auto" aria-hidden>
          <defs>
            <linearGradient id="es-kudos" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <path
            d="M100 116 C 46 86 28 58 52 40 C 70 26 92 38 100 56 C 108 38 130 26 148 40 C 172 58 154 86 100 116 Z"
            fill="url(#es-kudos)"
            opacity="0.2"
          />
          <path
            d="M100 100 C 58 78 46 58 62 44 C 76 32 92 42 100 58 C 108 42 124 32 138 44 C 154 58 142 78 100 100 Z"
            fill="url(#es-kudos)"
          />
          <circle cx="44" cy="38" r="4" fill="#ec4899" opacity="0.6" />
          <circle cx="160" cy="44" r="5" fill="#f97316" opacity="0.6" />
          <circle cx="160" cy="100" r="3" fill="#ec4899" opacity="0.6" />
        </svg>
      );
    case "notes":
      return (
        <svg viewBox="0 0 200 140" className="h-28 w-auto" aria-hidden>
          <defs>
            <linearGradient id="es-notes" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <rect x="30" y="26" width="84" height="96" rx="10" fill="url(#es-notes)" opacity="0.18" transform="rotate(-6 72 74)" />
          <rect x="66" y="18" width="84" height="96" rx="10" fill="url(#es-notes)" opacity="0.38" transform="rotate(4 108 66)" />
          <rect x="54" y="26" width="84" height="96" rx="10" fill="#fff" stroke="url(#es-notes)" strokeWidth="2" />
          <rect x="66" y="44" width="56" height="5" rx="2" fill="url(#es-notes)" />
          <rect x="66" y="58" width="46" height="4" rx="2" fill="url(#es-notes)" opacity="0.55" />
          <rect x="66" y="70" width="36" height="4" rx="2" fill="url(#es-notes)" opacity="0.35" />
        </svg>
      );
    case "polls":
      return (
        <svg viewBox="0 0 200 140" className="h-28 w-auto" aria-hidden>
          <defs>
            <linearGradient id="es-polls" x1="0" x2="0" y1="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <rect x="30" y="78" width="30" height="40" rx="6" fill="url(#es-polls)" opacity="0.35" />
          <rect x="70" y="52" width="30" height="66" rx="6" fill="url(#es-polls)" opacity="0.6" />
          <rect x="110" y="34" width="30" height="84" rx="6" fill="url(#es-polls)" />
          <rect x="150" y="64" width="30" height="54" rx="6" fill="url(#es-polls)" opacity="0.45" />
          <circle cx="128" cy="30" r="6" fill="#ec4899" />
        </svg>
      );
    case "activity":
      return (
        <svg viewBox="0 0 200 140" className="h-28 w-auto" aria-hidden>
          <defs>
            <linearGradient id="es-act" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <line x1="44" y1="32" x2="44" y2="120" stroke="url(#es-act)" strokeWidth="3" opacity="0.3" />
          <circle cx="44" cy="40" r="8" fill="url(#es-act)" />
          <circle cx="44" cy="76" r="8" fill="url(#es-act)" opacity="0.6" />
          <circle cx="44" cy="112" r="8" fill="url(#es-act)" opacity="0.35" />
          <rect x="64" y="30" width="110" height="22" rx="8" fill="url(#es-act)" opacity="0.25" />
          <rect x="64" y="66" width="84" height="22" rx="8" fill="url(#es-act)" opacity="0.18" />
          <rect x="64" y="102" width="60" height="22" rx="8" fill="url(#es-act)" opacity="0.12" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 200 140" className="h-28 w-auto" aria-hidden>
          <circle cx="100" cy="70" r="44" fill="currentColor" className="text-brand-500/20" />
          <circle cx="100" cy="70" r="28" fill="currentColor" className="text-brand-500/40" />
          <circle cx="100" cy="70" r="12" fill="currentColor" className="text-brand-500" />
        </svg>
      );
  }
};

interface Props {
  art: Art;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ art, title, description, action, className }: Props) => (
  <div
    className={`glass-card flex flex-col items-center justify-center gap-3 px-6 py-10 text-center ${className ?? ""}`}
  >
    <ArtSvg kind={art} />
    <div>
      <div className="font-display text-lg font-extrabold text-ink-primary">
        {title}
      </div>
      {description && (
        <p className="mt-1 max-w-md text-sm text-ink-secondary">{description}</p>
      )}
    </div>
    {action}
  </div>
);
