import type { MemberStatus } from "../types";
import { statusMeta } from "../lib/status";

export const StatusDot = ({
  status,
  showLabel = false,
}: {
  status: MemberStatus;
  showLabel?: boolean;
}) => {
  const s = statusMeta[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative inline-flex h-2.5 w-2.5">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${s.color}`}
        />
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${s.color}`}
        />
      </span>
      {showLabel && (
        <span className="text-xs font-semibold text-ink-secondary">{s.label}</span>
      )}
    </span>
  );
};
