import { FormEvent, useState } from "react";
import { Mail, KeyRound, LogIn, UserPlus, Info } from "lucide-react";
import {
  sendPasswordReset,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
} from "../../lib/auth";
import { LogoMark } from "../brand/Logo";
import { ThemeToggle } from "../brand/ThemeToggle";

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
      <div className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,#000_30%,transparent_75%)]">
        <div className="absolute -top-24 left-1/4 h-[420px] w-[420px] animate-float-slow rounded-full bg-violet-400/40 blur-3xl dark:bg-violet-500/25" />
        <div className="absolute top-1/3 right-0 h-[380px] w-[380px] animate-float-slow rounded-full bg-pink-400/40 blur-3xl dark:bg-pink-500/25" />
        <div className="absolute bottom-0 left-0 h-[340px] w-[340px] animate-float-slow rounded-full bg-sky-400/40 blur-3xl dark:bg-sky-500/25" />
      </div>

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="glass-panel animate-slide-up w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <LogoMark size={44} />
          <div>
            <div className="font-display text-xl font-extrabold leading-tight">
              teams<span className="gradient-text"> LABO</span>
            </div>
            <div className="text-xs text-ink-tertiary">
              チーム連携を、もっとカラフルに。
            </div>
          </div>
        </div>

        <div className="mb-5 inline-flex rounded-full bg-surface-raised/80 p-1 ring-1 ring-line">
          <button
            onClick={() => setMode("signin")}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              mode === "signin"
                ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow"
                : "text-ink-secondary hover:text-ink-primary"
            }`}
          >
            サインイン
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              mode === "signup"
                ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow"
                : "text-ink-secondary hover:text-ink-primary"
            }`}
          >
            新規登録
          </button>
        </div>

        <button
          type="button"
          onClick={google}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-surface-raised px-4 py-3 text-sm font-bold text-ink-primary shadow-sm ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <GoogleIcon />
          Googleで{mode === "signin" ? "サインイン" : "続行"}
        </button>

        <div className="mb-3 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-ink-tertiary">
          <div className="h-px flex-1 bg-line" />
          または
          <div className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink-secondary">
                表示名
              </span>
              <div className="relative">
                <UserPlus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="例：アキ"
                  className="input pl-9"
                />
              </div>
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-secondary">
              メールアドレス
            </span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input pl-9"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-secondary">
              パスワード
            </span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上"
                className="input pl-9"
              />
            </div>
          </label>

          {err && (
            <div className="animate-pop-in rounded-xl bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30">
              {err}
            </div>
          )}
          {msg && (
            <div className="animate-pop-in rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
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
              className="mx-auto block text-xs text-ink-tertiary underline-offset-2 hover:text-ink-primary hover:underline"
            >
              パスワードを忘れた
            </button>
          )}
        </form>

        <div className="mt-6 flex items-start gap-2 rounded-xl bg-surface-raised/60 p-3 text-[11px] text-ink-tertiary ring-1 ring-line">
          <Info className="h-4 w-4 flex-none text-ink-tertiary" />
          <span>
            サインイン後、<strong className="text-ink-secondary">チームの作成</strong>または<strong className="text-ink-secondary">招待コードでの参加</strong>に進みます。
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
