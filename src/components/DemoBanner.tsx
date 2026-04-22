import { Sparkles, X } from "lucide-react";
import { useStore } from "../store";

export const DemoBanner = () => {
  const {
    members,
    tasks,
    kudos,
    polls,
    notes,
    dismissDemoMembers,
    clearDemoContent,
    cloud,
  } = useStore();

  // Never show demo banner in cloud mode (real team data).
  if (cloud) return null;

  const hasDemoMembers = members.some((m) => m.isDemo);
  const hasDemoContent =
    tasks.some((t) => t.isDemo) ||
    kudos.some((k) => k.isDemo) ||
    polls.some((p) => p.isDemo) ||
    notes.some((n) => n.isDemo);

  if (!hasDemoMembers && !hasDemoContent) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-violet-200/60 bg-gradient-to-r from-violet-50 via-pink-50 to-amber-50 p-3 pl-4 shadow-sm">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/30">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <div className="font-bold text-slate-800">
          デモデータを表示中（アキ / レン / ソラ ほか）
        </div>
        <div className="text-xs text-slate-600">
          自分でタスク・Kudos・投票・メモを追加すると<strong>そのカテゴリのデモは自動で消えます</strong>。まとめて一度に消すには右のボタンを押してください。
        </div>
      </div>
      <button
        onClick={() => {
          if (
            confirm(
              "デモメンバー・デモタスク・Kudos・投票・メモをすべて削除します。よろしいですか？",
            )
          ) {
            clearDemoContent();
            if (hasDemoMembers) dismissDemoMembers();
          }
        }}
        className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
      >
        <X className="h-3 w-3" />
        デモをすべて消す
      </button>
    </div>
  );
};
