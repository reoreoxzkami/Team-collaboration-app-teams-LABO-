import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "./components/Header";
import { MobileTabBar, Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { ActivityFeed } from "./components/ActivityFeed";
import { Members } from "./components/Members";
import { TaskBoard } from "./components/TaskBoard";
import { KudosWall } from "./components/KudosWall";
import { MoodCheckin } from "./components/MoodCheckin";
import { Polls } from "./components/Polls";
import { Notes } from "./components/Notes";
import { DemoBanner } from "./components/DemoBanner";
import { AuthGate } from "./components/auth/AuthGate";
import { CommandPalette } from "./components/CommandPalette";
import { ShortcutCheatsheet } from "./components/ShortcutCheatsheet";
import { ToastHost } from "./lib/toast";
import { useGlobalHotkeys } from "./lib/shortcuts";
import { usePageTitle } from "./lib/seo";
import { useTheme } from "./lib/theme";
import type { View } from "./types";

const VIEW_META: Record<View, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard", sub: "チームの“今”をひと目で。" },
  activity: { title: "Activity", sub: "チーム全体の最近の動きを時系列で。" },
  members: { title: "Members", sub: "仲間のステータスと気分。" },
  tasks: { title: "Task Board", sub: "みんなでタスクを前に進める。" },
  kudos: { title: "Kudos Wall", sub: "感謝を贈り合う場所。" },
  mood: { title: "Mood Check-in", sub: "今日のあなたの気分は？" },
  polls: { title: "Polls", sub: "サクッと意思決定。" },
  notes: { title: "Shared Notes", sub: "気軽にシェアできるメモ。" },
};

const App = () => {
  // Keep theme initialized at the app root so localStorage + system
  // listeners are active before any children render.
  useTheme();

  const [view, setView] = useState<View>(() => {
    if (typeof window === "undefined") return "dashboard";
    const hash = window.location.hash.replace("#", "") as View;
    return VIEW_META[hash] ? hash : "dashboard";
  });

  useEffect(() => {
    const current = window.location.hash.replace(/^#/, "");
    // While the URL fragment still carries OAuth callback data
    // (access_token, refresh_token, error, ...), leave it untouched so the
    // Supabase client can parse it via detectSessionInUrl. Overwriting it
    // here would silently discard the session and bounce users back to login.
    if (
      /(^|&)(access_token|refresh_token|provider_token|error|error_description|error_code)=/.test(
        current,
      )
    ) {
      return;
    }
    if (current === view) return;
    window.location.hash = view;
  }, [view]);

  usePageTitle(VIEW_META[view].title);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [cheatOpen, setCheatOpen] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);

  useGlobalHotkeys({
    onOpenPalette: () => setPaletteOpen((v) => !v),
    onOpenCheatsheet: () => setCheatOpen(true),
    onNavigate: (v) => {
      setPaletteOpen(false);
      setView(v);
    },
  });

  const openTask = (id: string) => {
    setView("tasks");
    setFocusTaskId(id);
    setPaletteOpen(false);
  };

  return (
    <AuthGate>
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-4 lg:px-6 lg:py-6">
        <Sidebar view={view} onSelect={setView} />

        <main className="min-w-0 flex-1 pb-24 lg:pb-6">
          <Header onOpenPalette={() => setPaletteOpen(true)} onOpenCheatsheet={() => setCheatOpen(true)} />
          <DemoBanner />
          <div className="mb-5 flex items-center gap-3">
            <div>
              <div className="eyebrow">{VIEW_META[view].title}</div>
              <div className="text-sm text-ink-secondary">
                {VIEW_META[view].sub}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {view === "dashboard" && <Dashboard onNavigate={setView} />}
              {view === "activity" && <ActivityFeed />}
              {view === "members" && <Members />}
              {view === "tasks" && (
                <TaskBoard focusTaskId={focusTaskId} onTaskFocused={() => setFocusTaskId(null)} />
              )}
              {view === "kudos" && <KudosWall />}
              {view === "mood" && <MoodCheckin />}
              {view === "polls" && <Polls />}
              {view === "notes" && <Notes />}
            </motion.div>
          </AnimatePresence>
        </main>

        <MobileTabBar view={view} onSelect={setView} />
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={setView}
        onOpenTask={openTask}
      />
      <ShortcutCheatsheet open={cheatOpen} onClose={() => setCheatOpen(false)} />
      <ToastHost />
    </AuthGate>
  );
};

export default App;
