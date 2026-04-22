import { FormEvent, useState } from "react";
import { Sparkles, Mail, KeyRound, LogIn, UserPlus, Info } from "lucide-react";
import {
  sendPasswordReset,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
} from "../../lib/auth";

type Mode = "signin" | "signup";

export const LoginPage = () => {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUpWithPassword(email, password, displayName || undefined);
        setMsg("確認メールを送信しました。受信トレイをご確認ください。");
      } else {
        await signInWithPassword(email, password);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setErr(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "エラーが発生しました");
    }
  };

  const reset = async () => {
    if (!email) {
      setErr("先にメールアドレスを入力してください");
      return;
    }
    setErr(null);
    setMsg(null);
    try {
      await sendPasswordReset(email);
      setMsg("パスワード再設定メールを送信しました。");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "エラーが発生しました");
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-4">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-100 via-pink-100 to-amber-100" />
      <div className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,#000_30%,transparent_75%)]">
        <div className="absolute -top-24 left-1/4 h-[420px] w-[420px] rounded-full bg-violet-400/40 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-[380px] w-[380px] rounded-full bg-pink-400/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[340px] w-[340px] rounded-full bg-sky-400/40 blur-3xl" />
      </div>

      <div className="glass-panel w-full max-w-md p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/30">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <div className="font-display text-xl font-extrabold">
              <span className="gradient-text">teams LABO</span>
            </div>
            <div className="text-xs text-slate-500">
              チーム連携を、もっとカラフルに。
            </div>
          </div>
        </div>

        <div className="mb-5 inline-flex rounded-full bg-white/80 p-1 ring-1 ring-slate-200">
          <button
            onClick={() => setMode("signin")}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              mode === "signin"
                ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            サインイン
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              mode === "signup"
                ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            新規登録
          </button>
        </div>

        <button
          type="button"
          onClick={google}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          <GoogleIcon />
          Googleで{mode === "signin" ? "サインイン" : "続行"}
        </button>

        <div className="mb-3 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          または
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">
                表示名
              </span>
              <div className="relative">
                <UserPlus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="例：アキ"
                  className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                />
              </div>
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-600">
              メールアドレス
            </span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-600">
              パスワード
            </span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上"
                className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
              />
            </div>
          </label>

          {err && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-200">
              {err}
            </div>
          )}
          {msg && (
            <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 ring-1 ring-emerald-200">
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:brightness-110 disabled:opacity-60"
          >
            {mode === "signin" ? (
              <>
                <LogIn className="h-4 w-4" />
                {loading ? "サインイン中..." : "メールでサインイン"}
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                {loading ? "登録中..." : "新規登録"}
              </>
            )}
          </button>

          {mode === "signin" && (
            <button
              type="button"
              onClick={reset}
              className="mx-auto block text-xs text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
            >
              パスワードを忘れた
            </button>
          )}
        </form>

        <div className="mt-6 flex items-start gap-2 rounded-xl bg-white/60 p-3 text-[11px] text-slate-500 ring-1 ring-slate-200">
          <Info className="h-4 w-4 flex-none text-slate-400" />
          <span>
            サインイン後、<strong>チームの作成</strong>または<strong>招待コードでの参加</strong>に進みます。
          </span>
        </div>
      </div>
    </div>
  );
};

const GoogleIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 48 48"
    className="h-4 w-4"
    fill="none"
  >
    <path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.6 6.2 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
    />
    <path
      fill="#FF3D00"
      d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.6 6.2 29 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5 0 9.5-1.9 12.9-5l-6-4.9c-2 1.4-4.5 2.2-6.9 2.2-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6 4.9C40.6 35 44 30 44 24c0-1.2-.1-2.3-.4-3.5z"
    />
  </svg>
);
