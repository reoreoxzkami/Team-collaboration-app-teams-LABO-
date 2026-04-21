import type { Member } from "../types";

interface Props {
  member: Member | undefined;
  size?: "sm" | "md" | "lg" | "xl";
  ring?: boolean;
}

const sizeMap = {
  sm: "h-8 w-8 text-base",
  md: "h-10 w-10 text-lg",
  lg: "h-14 w-14 text-2xl",
  xl: "h-20 w-20 text-4xl",
};

export const Avatar = ({ member, size = "md", ring = false }: Props) => {
  if (!member) {
    return (
      <div
        className={`${sizeMap[size]} flex items-center justify-center rounded-full bg-slate-200 text-slate-400`}
      >
        ?
      </div>
    );
  }
  return (
    <div
      className={`relative ${sizeMap[size]} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${member.color} font-bold text-white shadow-glow ${ring ? "ring-4 ring-white" : ""}`}
      title={member.name}
    >
      <span>{member.emoji}</span>
    </div>
  );
};
