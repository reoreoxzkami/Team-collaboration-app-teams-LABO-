interface LogoProps {
  size?: number;
  className?: string;
  title?: string;
}

/**
 * teams LABO brand mark.
 * Three overlapping circles (team members blending) inside an aurora-tinted
 * rounded square — a miniature "lab" where team colors mix.
 */
export const LogoMark = ({
  size = 40,
  className,
  title = "teams LABO",
}: LogoProps) => (
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
      <linearGradient id="labo-tile" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="50%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>
      <radialGradient id="labo-halo" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
    </defs>

    <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#labo-tile)" />
    <rect
      x="2"
      y="2"
      width="60"
      height="60"
      rx="16"
      fill="url(#labo-halo)"
      opacity="0.9"
    />

    {/* three translucent circles suggesting collaborating people */}
    <g style={{ mixBlendMode: "screen" }} opacity="0.95">
      <circle cx="24" cy="26" r="12" fill="#ff87c5" opacity="0.9" />
      <circle cx="40" cy="26" r="12" fill="#8b5cf6" opacity="0.95" />
      <circle cx="32" cy="42" r="12" fill="#38bdf8" opacity="0.9" />
    </g>

    {/* central spark */}
    <circle cx="32" cy="32" r="3" fill="#ffffff" />
  </svg>
);

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
