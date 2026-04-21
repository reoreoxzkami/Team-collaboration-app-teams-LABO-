import {
  CheckSquare,
  Heart,
  LayoutDashboard,
  Sparkles,
  StickyNote,
  Users,
  Vote,
  Sparkle,
} from "lucide-react";
import type { View } from "../types";

const items: { id: View; label: string; icon: React.ReactNode; accent: string }[] =
  [
    {
      id: "dashboard",
      label: "ダッシュボード",
      icon: <LayoutDashboard className="h-5 w-5" />,
      accent: "from-fuchsia-500 to-pink-500",
    },
    {
      id: "members",
      label: "メンバー",
      icon: <Users className="h-5 w-5" />,
      accent: "from-violet-500 to-indigo-500",
    },
    {
      id: "tasks",
      label: "タスクボード",
      icon: <CheckSquare className="h-5 w-5" />,
      accent: "from-sky-500 to-cyan-500",
    },
    {
      id: "kudos",
      label: "Kudos",
      icon: <Heart className="h-5 w-5" />,
      accent: "from-pink-500 to-rose-500",
    },
    {
      id: "mood",
      label: "気分チェックイン",
      icon: <Sparkles className="h-5 w-5" />,
      accent: "from-amber-500 to-orange-500",
    },
    {
      id: "polls",
      label: "投票",
      icon: <Vote className="h-5 w-5" />,
      accent: "from-emerald-500 to-teal-500",
    },
    {
      id: "notes",
      label: "メモ",
      icon: <StickyNote className="h-5 w-5" />,
      accent: "from-yellow-500 to-amber-500",
    },
  ];

interface Props {
  view: View;
  onSelect: (v: View) => void;
}

export const Sidebar = ({ view, onSelect }: Props) => {
  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 flex-col gap-2 lg:flex">
      <div className="glass-card gradient-border flex items-center gap-3 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-sky-500 text-white shadow-glow">
          <Sparkle className="h-6 w-6" />
        </div>
        <div>
          <div className="font-display text-lg font-extrabold leading-tight">
            teams<span className="gradient-text"> LABO</span>
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            team collaboration PWA
          </div>
        </div>
      </div>

      <nav className="glass-card flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                active
                  ? "text-white shadow-glow"
                  : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
              }`}
            >
              {active && (
                <span
                  aria-hidden
                  className={`absolute inset-0 -z-0 bg-gradient-to-r ${item.accent}`}
                />
              )}
              <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                {item.icon}
              </span>
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="glass-card p-4 text-xs text-slate-600">
        <div className="font-semibold text-slate-700">💡 ヒント</div>
        データは端末内に保存されます。ホーム画面に追加してアプリとして使えます。
      </div>
    </aside>
  );
};

export const MobileTabBar = ({ view, onSelect }: Props) => {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 lg:hidden">
      <div className="glass-card flex items-center justify-between gap-1 p-2">
        {items.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition ${
                active
                  ? "bg-gradient-to-br text-white shadow-glow " + item.accent
                  : "text-slate-500"
              }`}
              title={item.label}
            >
              <span className="flex h-7 w-7 items-center justify-center">
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
