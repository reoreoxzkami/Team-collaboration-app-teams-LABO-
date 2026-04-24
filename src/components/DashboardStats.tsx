import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, BarChart3, Heart, PieChart as PieIcon } from "lucide-react";
import { useStore } from "../store";

const MOOD_SCORE: Record<string, number> = {
  "🤩": 5,
  "😄": 5,
  "😊": 4,
  "🙂": 4,
  "🤔": 3,
  "😐": 3,
  "😴": 2,
  "😵": 2,
  "😫": 1,
  "😭": 1,
};

const moodLabel = (v: number) => {
  if (v >= 4.5) return "絶好調";
  if (v >= 3.5) return "好調";
  if (v >= 2.5) return "普通";
  if (v >= 1.5) return "低調";
  return "要ケア";
};

const dayKey = (d: Date) =>
  `${d.getMonth() + 1}/${d.getDate()}`;

const last7Days = (): Date[] => {
  const out: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d);
  }
  return out;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const tooltipStyle: React.CSSProperties = {
  background: "rgb(var(--c-surface-raised))",
  border: "1px solid rgb(var(--c-line))",
  borderRadius: 12,
  color: "rgb(var(--c-ink-primary))",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,.12)",
};

export const DashboardStats = () => {
  const { kudos, tasks, members } = useStore();
  const days = useMemo(() => last7Days(), []);

  const kudosSeries = useMemo(
    () =>
      days.map((d) => ({
        day: dayKey(d),
        count: kudos.filter((k) => sameDay(new Date(k.createdAt), d)).length,
      })),
    [days, kudos],
  );

  const completionSeries = useMemo(
    () =>
      days.map((d) => {
        // Tasks that existed on that day (created on or before) and their done-state on that day
        const existing = tasks.filter(
          (t) => new Date(t.createdAt).getTime() <= d.getTime() + 86_400_000,
        );
        const done = existing.filter((t) => t.status === "done").length;
        const rate = existing.length === 0 ? 0 : Math.round((done / existing.length) * 100);
        return { day: dayKey(d), rate, done, total: existing.length };
      }),
    [days, tasks],
  );

  const moodSeries = useMemo(() => {
    // Use each member's current mood + moodUpdatedAt to compute a day bucket.
    return days.map((d) => {
      const scores = members
        .filter((m) => m.moodUpdatedAt && new Date(m.moodUpdatedAt) <= d)
        .map((m) => MOOD_SCORE[m.mood] ?? 3);
      const avg = scores.length === 0 ? 0 : scores.reduce((a, b) => a + b, 0) / scores.length;
      return { day: dayKey(d), mood: Number(avg.toFixed(2)) };
    });
  }, [days, members]);

  const statusBreakdown = useMemo(() => {
    const buckets: Record<string, number> = {
      todo: 0,
      doing: 0,
      review: 0,
      done: 0,
    };
    for (const t of tasks) buckets[t.status] = (buckets[t.status] ?? 0) + 1;
    return [
      { name: "To Do", value: buckets.todo, fill: "#94a3b8" },
      { name: "Doing", value: buckets.doing, fill: "#6366f1" },
      { name: "Review", value: buckets.review, fill: "#f59e0b" },
      { name: "Done", value: buckets.done, fill: "#10b981" },
    ];
  }, [tasks]);

  const totalKudos = kudosSeries.reduce((a, b) => a + b.count, 0);
  const latestRate = completionSeries[completionSeries.length - 1]?.rate ?? 0;
  const latestMood = moodSeries[moodSeries.length - 1]?.mood ?? 0;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="glass-card p-5 xl:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 text-white">
              <Heart className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-extrabold text-ink-primary">
              Kudos 推移
            </h3>
          </div>
          <span className="chip bg-pink-500/10 text-pink-700 ring-1 ring-pink-500/20 dark:text-pink-200">
            週合計 {totalKudos}
          </span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={kudosSeries} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="kudosGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-line))" />
              <XAxis dataKey="day" stroke="rgb(var(--c-ink-tertiary))" fontSize={11} tickLine={false} />
              <YAxis stroke="rgb(var(--c-ink-tertiary))" fontSize={11} tickLine={false} allowDecimals={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgb(var(--c-line))" }} />
              <Area type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={2.5} fill="url(#kudosGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-5 xl:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-extrabold text-ink-primary">
              タスク完了率
            </h3>
          </div>
          <span className="chip bg-indigo-500/10 text-indigo-700 ring-1 ring-indigo-500/20 dark:text-indigo-200">
            直近 {latestRate}%
          </span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={completionSeries} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-line))" />
              <XAxis dataKey="day" stroke="rgb(var(--c-ink-tertiary))" fontSize={11} tickLine={false} />
              <YAxis stroke="rgb(var(--c-ink-tertiary))" fontSize={11} tickLine={false} width={32} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgb(var(--c-line) / 0.25)" }} formatter={(v) => [`${v}%`, "完了率"] as [string, string]} />
              <Bar dataKey="rate" fill="url(#rateGrad)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-5 xl:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-extrabold text-ink-primary">
              気分トレンド
            </h3>
          </div>
          <span className="chip bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-200">
            今日 {moodLabel(latestMood)}
          </span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodSeries} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-line))" />
              <XAxis dataKey="day" stroke="rgb(var(--c-ink-tertiary))" fontSize={11} tickLine={false} />
              <YAxis stroke="rgb(var(--c-ink-tertiary))" fontSize={11} tickLine={false} domain={[0, 5]} width={20} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [Number(v).toFixed(2), "平均気分 (1–5)"] as [string, string]} />
              <Line type="monotone" dataKey="mood" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: "#10b981" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-5 xl:col-span-2">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white">
            <PieIcon className="h-5 w-5" />
          </div>
          <h3 className="font-display text-lg font-extrabold text-ink-primary">
            タスク構成比
          </h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={72}
                paddingAngle={3}
              >
                {statusBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: 11, color: "rgb(var(--c-ink-secondary))" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};
