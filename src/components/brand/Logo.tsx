interface LogoProps {
  size?: number;
  className?: string;
  title?: string;
}

/**
 * teams LABO brand mark.
 * Three overlapping color wells (coral / violet / cyan) sitting inside a
 * rounded-square "lab tile". The three wells represent individual members
 * whose colors blend where they overlap — the central white spark is the
 * "reaction" that collaboration produces.
 */
export const LogoMark = ({
  size = 40,
  className,
  title = "teams LABO",
}: LogoProps) => {
  // Stable gradient IDs per mount so multiple logos on one page don't collide.
  const uid = `labo-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={`${uid}-tile`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff2f64" />
          <stop offset="45%" stopColor="#7a4dff" />
          <stop offset="100%" stopColor="#00d4ff" />
        </linearGradient>
        <radialGradient id={`${uid}-halo`} cx="30%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-spark`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="70%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${uid}-tile)`} />
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="16"
        fill={`url(#${uid}-halo)`}
        opacity="0.92"
      />

      {/* three translucent wells suggesting collaborating members */}
      <g style={{ mixBlendMode: "screen" }} opacity="0.95">
        <circle cx="24" cy="26" r="12" fill="#ff5fa2" opacity="0.92" />
        <circle cx="40" cy="26" r="12" fill="#9373ff" opacity="0.95" />
        <circle cx="32" cy="42" r="12" fill="#00d4ff" opacity="0.92" />
      </g>

      {/* central reaction spark */}
      <circle cx="32" cy="32" r="4.5" fill={`url(#${uid}-spark)`} />
      <circle cx="32" cy="32" r="2" fill="#ffffff" />
    </svg>
  );
};

interface WordmarkProps extends LogoProps {
  align?: "inline" | "stack";
}

export const Wordmark = ({
  size = 40,
  className,
  align = "inline",
}: WordmarkProps) => (
  <div
    className={`flex ${align === "stack" ? "flex-col items-start gap-1" : "items-center gap-3"} ${
      className ?? ""
    }`}
  >
    <LogoMark size={size} />
    <div className="leading-tight">
      <div className="font-display text-lg font-extrabold tracking-tight text-ink-primary">
        teams<span className="gradient-text"> LABO</span>
      </div>
      <div className="text-[11px] font-medium text-ink-tertiary">
        team collaboration lab
      </div>
    </div>
  </div>
);
