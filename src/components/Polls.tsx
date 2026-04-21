import { useState } from "react";
import { Plus, Lock, Unlock, Trash2 } from "lucide-react";
import { useStore } from "../store";
import { timeAgo } from "../lib/time";

export const Polls = () => {
  const { polls, members, currentUserId, addPoll, voteOnPoll, closePoll } =
    useStore();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);

  const submit = () => {
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || cleaned.length < 2) return;
    addPoll({ question: question.trim(), options: cleaned });
    setQuestion("");
    setOptions(["", ""]);
  };

  return (
    <div className="space-y-6">
      <section className="glass-card relative overflow-hidden p-6">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-emerald-300 via-teal-400 to-sky-400 opacity-70 blur-2xl"
        />
        <div className="relative">
          <h2 className="font-display text-xl font-extrabold">
            クイック投票を作成
          </h2>
          <p className="text-sm text-slate-600">
            ちょっとした意思決定はサクッと投票で。
          </p>

          <input
            className="input mt-4"
            placeholder="質問を入力"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="mt-3 space-y-2">
            {options.map((o, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder={`選択肢 ${i + 1}`}
                  value={o}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                />
                {options.length > 2 && (
                  <button
                    className="btn-ghost"
                    onClick={() =>
                      setOptions(options.filter((_, idx) => idx !== i))
                    }
                    title="削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              className="btn-ghost"
              onClick={() => setOptions([...options, ""])}
            >
              <Plus className="h-4 w-4" /> 選択肢を追加
            </button>
            <button className="btn-primary ml-auto" onClick={submit}>
              投票を開始
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {polls.map((p) => {
          const total = p.options.reduce((acc, o) => acc + o.votes.length, 0);
          const createdBy = members.find((m) => m.id === p.createdById);
          return (
            <article key={p.id} className="glass-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-extrabold">
                    {p.question}
                  </h3>
                  <div className="text-xs text-slate-500">
                    {createdBy?.name} さん ・ {timeAgo(p.createdAt)} ・ 総投票{" "}
                    {total}
                  </div>
                </div>
                <button
                  onClick={() => closePoll(p.id)}
                  className="btn-ghost"
                  title={p.closed ? "再開する" : "締め切る"}
                >
                  {p.closed ? (
                    <Unlock className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {p.closed ? "再開" : "締切"}
                  </span>
                </button>
              </div>

              <ul className="mt-4 space-y-2">
                {p.options.map((o, idx) => {
                  const pct = total === 0 ? 0 : (o.votes.length / total) * 100;
                  const mine = o.votes.includes(currentUserId);
                  const accent = [
                    "from-pink-400 to-rose-500",
                    "from-violet-400 to-fuchsia-500",
                    "from-sky-400 to-indigo-500",
                    "from-emerald-400 to-teal-500",
                    "from-amber-400 to-orange-500",
                    "from-cyan-400 to-blue-500",
                  ][idx % 6];
                  return (
                    <li key={o.id}>
                      <button
                        disabled={p.closed}
                        onClick={() => voteOnPoll(p.id, o.id)}
                        className={`relative flex w-full items-center justify-between overflow-hidden rounded-2xl border bg-white/80 px-4 py-2.5 text-left text-sm transition ${
                          mine
                            ? "border-transparent ring-2 ring-brand-400"
                            : "border-slate-100 hover:border-brand-200"
                        } ${p.closed ? "opacity-70" : ""}`}
                      >
                        <div
                          className={`absolute inset-y-0 left-0 bg-gradient-to-r opacity-30 ${accent}`}
                          style={{ width: `${pct}%` }}
                        />
                        <span className="relative z-10 font-semibold text-slate-700">
                          {mine && "✓ "}
                          {o.text}
                        </span>
                        <span className="relative z-10 text-xs font-bold text-slate-600">
                          {o.votes.length}票 ({Math.round(pct)}%)
                        </span>
                      </button>
                      {o.votes.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1 pl-3">
                          {o.votes.map((uid) => {
                            const v = members.find((m) => m.id === uid);
                            return (
                              <span
                                key={uid}
                                className="chip bg-white text-[10px] text-slate-600 ring-1 ring-slate-200"
                                title={v?.name}
                              >
                                {v?.emoji} {v?.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
        {polls.length === 0 && (
          <div className="glass-card p-6 text-center text-sm text-slate-500 lg:col-span-2">
            まだ投票がありません。
          </div>
        )}
      </div>
    </div>
  );
};
