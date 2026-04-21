import type { MemberStatus } from "../types";

const map: Record<MemberStatus, { label: string; color: string }> = {
  online: { label: "オンライン", color: "bg-emerald-500" },
  focus: { label: "集中", color: "bg-violet-500" },
  away: { label: "離席", color: "bg-amber-500" },
  offline: { label: "オフライン", color: "bg-slate-400" },
};

export const StatusDot = ({
  status,
  showLabel = false,
}: {
  status: MemberStatus;
  showLabel?: boolean;
}) => {
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`relative inline-flex h-2.5 w-2.5`}>
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${s.color}`}
        />
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${s.color}`}
        />
      </span>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-600">{s.label}</span>
      )}
    </span>
  );
};

export const statusLabel = (status: MemberStatus) => map[status].label;
