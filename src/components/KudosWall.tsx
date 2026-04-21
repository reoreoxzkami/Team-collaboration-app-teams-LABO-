import { useState } from "react";
import { Send } from "lucide-react";
import { useStore } from "../store";
import { Avatar } from "./Avatar";
import { timeAgo } from "../lib/time";

const QUICK_EMOJIS = ["🎉", "🙌", "💖", "🚀", "🔥", "🌟", "💡", "☕", "🍀"];
const REACT_EMOJIS = ["👏", "🎉", "❤️", "🔥", "🚀"];

export const KudosWall = () => {
  const {
    kudos,
    members,
    currentUserId,
    addKudos,
    toggleKudosReaction,
  } = useStore();

  const [toId, setToId] = useState(
    members.find((m) => m.id !== currentUserId)?.id ?? "",
  );
  const [message, setMessage] = useState("");
  const [emoji, setEmoji] = useState("🎉");

  const submit = () => {
    if (!toId || !message.trim()) return;
    addKudos({ toId, message: message.trim(), emoji });
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <section className="glass-card relative overflow-hidden p-6">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-pink-400 via-fuchsia-400 to-indigo-400 opacity-70 blur-2xl"
        />
        <div className="relative">
          <h2 className="font-display text-xl font-extrabold">
            感謝を贈ろう 💌
          </h2>
          <p className="text-sm text-slate-600">
            小さな「ありがとう」がチームを育てます。
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
            <select
              className="input md:col-span-3"
              value={toId}
              onChange={(e) => setToId(e.target.value)}
            >
              {members
                .filter((m) => m.id !== currentUserId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    To: {m.emoji} {m.name}
                  </option>
                ))}
            </select>
            <input
              className="input md:col-span-7"
              placeholder="どんなところが素敵だった？"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <button className="btn-primary md:col-span-2" onClick={submit}>
              <Send className="h-4 w-4" /> 贈る
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`chip text-lg transition ${
                  emoji === e
                    ? "bg-brand-600 text-white"
                    : "bg-white ring-1 ring-slate-200 hover:bg-brand-50"
                }`}
                title={e}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kudos.map((k) => {
          const from = members.find((m) => m.id === k.fromId);
          const to = members.find((m) => m.id === k.toId);
          return (
            <article
              key={k.id}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${k.color} p-5 text-white shadow-glow`}
            >
              <div
                aria-hidden
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/30 blur-2xl"
              />
              <div className="relative flex items-center gap-2 text-xs font-semibold opacity-90">
                <Avatar member={from} size="sm" />
                <span className="font-bold">{from?.name}</span>
                <span>→</span>
                <Avatar member={to} size="sm" />
                <span className="font-bold">{to?.name}</span>
                <span className="ml-auto opacity-80">
                  {timeAgo(k.createdAt)}
                </span>
              </div>
              <div className="relative mt-3 text-4xl">{k.emoji}</div>
              <div className="relative mt-1 text-sm leading-relaxed">
                {k.message}
              </div>
              <div className="relative mt-4 flex flex-wrap gap-1.5">
                {REACT_EMOJIS.map((e) => {
                  const users = k.reactions[e] ?? [];
                  const mine = users.includes(currentUserId);
                  return (
                    <button
                      key={e}
                      onClick={() => toggleKudosReaction(k.id, e)}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition ${
                        mine
                          ? "bg-white text-slate-800"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }`}
                    >
                      <span className="text-base leading-none">{e}</span>
                      {users.length > 0 && <span>{users.length}</span>}
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
        {kudos.length === 0 && (
          <div className="glass-card p-6 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
            まだKudosがありません。最初の感謝を贈ろう ✨
          </div>
        )}
      </div>
    </div>
  );
};
