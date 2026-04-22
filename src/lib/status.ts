import type { MemberStatus } from "../types";

export const statusMeta: Record<
  MemberStatus,
  { label: string; color: string }
> = {
  online: { label: "オンライン", color: "bg-emerald-500" },
  focus: { label: "集中", color: "bg-violet-500" },
  away: { label: "離席", color: "bg-amber-500" },
  offline: { label: "オフライン", color: "bg-slate-400" },
};

export const statusLabel = (status: MemberStatus) => statusMeta[status].label;
