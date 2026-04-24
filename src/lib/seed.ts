import type { Kudos, Member, Note, Poll, Task } from "../types";
import { uid } from "./id";

export const MEMBER_COLORS = [
  "from-pink-400 to-rose-500",
  "from-violet-400 to-fuchsia-500",
  "from-sky-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-blue-500",
  "from-lime-400 to-emerald-500",
  "from-rose-400 to-pink-500",
];

export const NOTE_COLORS = [
  "from-pink-100 to-rose-200",
  "from-amber-100 to-yellow-200",
  "from-emerald-100 to-teal-200",
  "from-sky-100 to-indigo-200",
  "from-violet-100 to-fuchsia-200",
  "from-orange-100 to-pink-200",
];

export const KUDOS_COLORS = [
  "from-pink-500 to-rose-500",
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
];

const now = () => new Date().toISOString();
const minutesAgo = (m: number) =>
  new Date(Date.now() - m * 60 * 1000).toISOString();
const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

export const seedMembers = (): Member[] => [
  {
    id: "m-aki",
    name: "アキ",
    role: "プロダクトリード",
    color: MEMBER_COLORS[0],
    emoji: "🦄",
    status: "online",
    mood: "🔥",
    moodNote: "新しいロードマップ、ワクワクが止まらない！",
    moodUpdatedAt: minutesAgo(10),
    isDemo: true,
  },
  {
    id: "m-ren",
    name: "レン",
    role: "デザイナー",
    color: MEMBER_COLORS[1],
    emoji: "🎨",
    status: "focus",
    mood: "✨",
    moodNote: "配色を整えてます。DM歓迎！",
    moodUpdatedAt: minutesAgo(32),
    isDemo: true,
  },
  {
    id: "m-sora",
    name: "ソラ",
    role: "エンジニア",
    color: MEMBER_COLORS[2],
    emoji: "🛠️",
    status: "online",
    mood: "🚀",
    moodNote: "デプロイ楽しい。今日もバグゼロを狙う。",
    moodUpdatedAt: minutesAgo(5),
    isDemo: true,
  },
  {
    id: "m-mio",
    name: "ミオ",
    role: "マーケター",
    color: MEMBER_COLORS[3],
    emoji: "📣",
    status: "away",
    mood: "☕",
    moodNote: "打ち合わせから戻ります。",
    moodUpdatedAt: hoursAgo(1),
    isDemo: true,
  },
  {
    id: "m-yui",
    name: "ユイ",
    role: "カスタマーサクセス",
    color: MEMBER_COLORS[4],
    emoji: "💛",
    status: "online",
    mood: "😊",
    moodNote: "ユーザーさんからの嬉しい声をシェアします！",
    moodUpdatedAt: minutesAgo(22),
    isDemo: true,
  },
  {
    id: "m-taku",
    name: "タク",
    role: "データサイエンティスト",
    color: MEMBER_COLORS[5],
    emoji: "📊",
    status: "focus",
    mood: "🧠",
    moodNote: "指標を分析中。午後に共有します。",
    moodUpdatedAt: minutesAgo(48),
    isDemo: true,
  },
];

export const seedTasks = (): Task[] => [
  {
    id: uid(),
    title: "新ロゴのバリエーション作成",
    description: "3案＋カラーバリエーションを用意する",
    status: "doing",
    assigneeId: "m-ren",
    priority: "high",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["デザイン", "ブランディング"],
    sortOrder: 6000,
    createdAt: hoursAgo(5),
    isDemo: true,
  },
  {
    id: uid(),
    title: "ログイン画面のA/Bテスト準備",
    description: "分析基盤にイベントを仕込む",
    status: "todo",
    assigneeId: "m-taku",
    priority: "medium",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["実験", "データ"],
    sortOrder: 5000,
    createdAt: hoursAgo(9),
    isDemo: true,
  },
  {
    id: uid(),
    title: "ユーザーインタビュー 3本",
    description: "先週のフィードバックをまとめる",
    status: "review",
    assigneeId: "m-yui",
    priority: "medium",
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["リサーチ"],
    sortOrder: 4000,
    createdAt: hoursAgo(24),
    isDemo: true,
  },
  {
    id: uid(),
    title: "PWA化の技術検証",
    description: "オフライン時の挙動確認",
    status: "done",
    assigneeId: "m-sora",
    priority: "high",
    dueDate: null,
    tags: ["技術", "PWA"],
    sortOrder: 3000,
    createdAt: hoursAgo(30),
    isDemo: true,
  },
  {
    id: uid(),
    title: "四半期キックオフの準備",
    description: "資料ドラフトとアジェンダ",
    status: "todo",
    assigneeId: "m-aki",
    priority: "high",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["プランニング"],
    sortOrder: 2000,
    createdAt: hoursAgo(2),
    isDemo: true,
  },
  {
    id: uid(),
    title: "SNS投稿カレンダー更新",
    description: "来月分のテーマ決め",
    status: "doing",
    assigneeId: "m-mio",
    priority: "low",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["マーケ", "SNS"],
    sortOrder: 1000,
    createdAt: hoursAgo(12),
    isDemo: true,
  },
];

export const seedKudos = (): Kudos[] => [
  {
    id: uid(),
    fromId: "m-aki",
    toId: "m-sora",
    message: "デプロイ周りの改善、本当に助かってます！",
    emoji: "🚀",
    color: KUDOS_COLORS[0],
    createdAt: hoursAgo(3),
    isDemo: true,
    reactions: { "🎉": ["m-ren", "m-yui"], "👏": ["m-mio"] },
  },
  {
    id: uid(),
    fromId: "m-ren",
    toId: "m-yui",
    message: "ユーザーの声まとめ、すごく読みやすい！",
    emoji: "💛",
    color: KUDOS_COLORS[2],
    createdAt: hoursAgo(8),
    isDemo: true,
    reactions: { "❤️": ["m-aki"] },
  },
  {
    id: uid(),
    fromId: "m-mio",
    toId: "m-ren",
    message: "新ビジュアル、みんなからテンション上がるって声！",
    emoji: "🎨",
    color: KUDOS_COLORS[1],
    createdAt: hoursAgo(20),
    isDemo: true,
    reactions: { "🔥": ["m-aki", "m-sora"] },
  },
];

export const seedPolls = (): Poll[] => [
  {
    id: uid(),
    question: "来週の全体ミーティング、何時がベスト？",
    options: [
      { id: uid(), text: "月曜 10:00", votes: ["m-aki", "m-sora"] },
      { id: uid(), text: "水曜 14:00", votes: ["m-ren", "m-mio", "m-yui"] },
      { id: uid(), text: "金曜 16:00", votes: ["m-taku"] },
    ],
    createdAt: hoursAgo(6),
    isDemo: true,
    closed: false,
    createdById: "m-aki",
  },
  {
    id: uid(),
    question: "チームランチ、どれ行きたい？",
    options: [
      { id: uid(), text: "ピザ 🍕", votes: ["m-sora", "m-mio"] },
      { id: uid(), text: "タコス 🌮", votes: ["m-aki", "m-ren"] },
      { id: uid(), text: "ラーメン 🍜", votes: ["m-yui", "m-taku"] },
      { id: uid(), text: "サラダボウル 🥗", votes: [] },
    ],
    createdAt: hoursAgo(18),
    isDemo: true,
    closed: false,
    createdById: "m-mio",
  },
];

export const seedNotes = (): Note[] => [
  {
    id: uid(),
    title: "今週の目標 🎯",
    content:
      "1. PWAバージョンを公開\n2. ユーザーインタビュー3件\n3. 次のスプリント計画",
    color: NOTE_COLORS[0],
    pinned: true,
    authorId: "m-aki",
    updatedAt: hoursAgo(2),
    isDemo: true,
  },
  {
    id: uid(),
    title: "デザイン原則",
    content:
      "・カラフルでも読みやすく\n・余白をケチらない\n・モバイルでも気持ちよく",
    color: NOTE_COLORS[4],
    pinned: true,
    authorId: "m-ren",
    updatedAt: hoursAgo(7),
    isDemo: true,
  },
  {
    id: uid(),
    title: "ドッグフーディング結果",
    content:
      "チーム内で1週間触った感想まとめ。Kudosのリアクションが想像以上に盛り上がった！",
    color: NOTE_COLORS[2],
    pinned: false,
    authorId: "m-yui",
    updatedAt: hoursAgo(26),
    isDemo: true,
  },
  {
    id: uid(),
    title: "アイデアメモ",
    content: "・週次で自動ハイライト\n・休憩リマインダー\n・バースデーボット",
    color: NOTE_COLORS[1],
    pinned: false,
    authorId: "m-sora",
    updatedAt: hoursAgo(50),
    isDemo: true,
  },
];

// Bumped to 2 after adding required `tags`/`sortOrder`/`dueDate` fields to Task
// (PR #9). Without a bump, zustand persist restores old tasks lacking these
// fields and UI crashes on `task.tags.map`.
export const SEED_VERSION = 2;
export const INITIAL_CURRENT_USER_ID = "m-aki";
export { now };
