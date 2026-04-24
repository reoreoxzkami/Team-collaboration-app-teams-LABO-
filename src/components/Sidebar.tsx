import { useEffect, useState } from "react";
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Heart,
  LayoutDashboard,
  Sparkles,
  StickyNote,
  Users,
  Vote,
} from "lucide-react";
import type { View } from "../types";
import { LogoMark } from "./brand/Logo";

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

const COLLAPSE_KEY = "teams-labo-sidebar-collapsed";

export const Sidebar = ({ view, onSelect }: Props) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  });

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <aside
      className={`sticky top-4 hidden h-[calc(100vh-2rem)] flex-col gap-2 transition-[width] duration-300 lg:flex ${
        collapsed ? "w-[76px]" : "w-64"
      }`}
    >
      <div className="glass-card gradient-border relative flex items-center gap-3 p-3">
        <div className="flex-none">
          <LogoMark size={collapsed ? 40 : 44} />
        </div>
        <div
          className={`overflow-hidden transition-all duration-200 ${
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          }`}
        >
          <div className="font-display text-lg font-extrabold leading-tight text-ink-primary">
            teams<span className="gradient-text"> LABO</span>
          </div>
          <div className="text-[11px] font-medium text-ink-tertiary">
            team collaboration lab
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface-raised text-ink-secondary shadow-sm transition hover:text-ink-primary"
          aria-label={collapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
          title={collapsed ? "展開" : "折りたたむ"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <nav className="glass-card flex flex-1 flex-col gap-1 p-2">
        {items.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              title={collapsed ? item.label : undefined}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-2.5 py-2.5 text-left text-sm font-semibold transition-all ${
                active
                  ? "text-white shadow-glow"
                  : "text-ink-secondary hover:bg-surface-raised/60 hover:text-ink-primary"
              }`}
            >
              {active && (
                <span
                  aria-hidden
                  className={`absolute inset-0 -z-0 bg-gradient-to-r ${item.accent}`}
                />
              )}
              <span className="relative z-10 flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-white/20">
                {item.icon}
              </span>
              <span
                className={`relative z-10 overflow-hidden whitespace-nowrap transition-all duration-200 ${
                  collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="glass-card animate-fade-in p-4 text-xs text-ink-secondary">
          <div className="font-semibold text-ink-primary">💡 ヒント</div>
          <span className="text-ink-tertiary">
            データはチームで同期。ホーム画面に追加してアプリとして使えます。
          </span>
        </div>
      )}
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
                  : "text-ink-tertiary"
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
