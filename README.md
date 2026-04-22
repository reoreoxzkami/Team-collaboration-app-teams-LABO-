# teams LABO ✨

チームの連携を高めるカラフルな PWA（Progressive Web App）。
タスク管理・Kudos・気分チェックイン・投票・共有メモをひとつにまとめた、軽量なチームハブです。

> 💡 Chromebook ユーザーでもアプリのように使えます。ブラウザのアドレスバー右端の「インストール」ボタンでホーム画面に追加できます。

## 🚀 機能

- **ダッシュボード**：チームの"今"をひと目で把握
- **メンバー**：ステータス（オンライン / 集中 / 離席 / オフライン）と自己紹介的な気分コメント
- **タスクボード**：ドラッグ＆ドロップの Kanban（To Do / Doing / Review / Done）
- **Kudos ウォール**：メンバーに感謝を贈り合い、絵文字でリアクション
- **気分チェックイン**：今日の気分を絵文字でシェア、チーム全体の気分サマリーも可視化
- **投票**：選択肢を作ってサクッと合意形成
- **共有メモ**：カラフルな付箋風の共有ノート、ピン留めも可能

データはデフォルトではブラウザの localStorage に保存されます（無料ホスティングだけで完結）。
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` を設定すると、メール / Google サインインとチーム作成・招待コード参加が有効になります（下記「🔐 Supabase を有効化する」参照）。

## 🛠 技術スタック

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) でカラフル＆モダンなデザイン
- [Zustand](https://zustand.docs.pmnd.rs/) で軽量な状態管理（localStorage 永続化）
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) で PWA 化（Service Worker, Manifest）
- [lucide-react](https://lucide.dev/) のアイコン
- GitHub Actions で GitHub Pages に自動デプロイ

## 🧑‍💻 開発

```bash
npm install
npm run dev       # 開発サーバー (http://localhost:5173)
npm run build     # 本番ビルド
npm run preview   # 本番ビルドのプレビュー
npm run lint      # ESLint
npm run typecheck # TypeScript 型チェック
```

## 🌐 公開（GitHub Pages）

`main` ブランチへの push で自動的に GitHub Pages にデプロイされます。

### 初回のみ GitHub Pages を有効化

1. リポジトリの **Settings → Pages** を開く
2. **Source** を `GitHub Actions` に設定

公開URLは以下の形式になります：

```
https://<GitHub Username>.github.io/Team-collaboration-app-teams-LABO-/
```

## 🔐 Supabase を有効化する（任意）

Supabase を設定すると以下が有効になります：

- メール / パスワードと **Google** サインイン
- **チーム作成** と **招待コードでの参加**（1 ユーザー → 複数チーム所属可）
- Row-Level Security による他チームとの完全分離

### 手順

1. [Supabase Dashboard](https://supabase.com/dashboard) で New Project を作成（Region は `Northeast Asia (Tokyo)` 推奨）
2. **Settings → API** から `Project URL` と `anon public key` をコピー
3. **ローカル開発**：リポジトリ直下に `.env.local` を作成
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxxxxxx
   ```
4. **本番**：GitHub リポジトリの **Settings → Secrets and variables → Actions → Variables** で同じ名前の Repository variable を追加（※Secret ではなく Variable で OK。クライアントサイドに露出する想定の anon key のため）
5. **SQL Editor** で `supabase/migrations/0001_init.sql` の内容を貼り付けて Run（スキーマ + RLS + RPC が作成されます）
6. **Authentication → Providers** で
   - `Email`：Enabled（デフォルト ON）
   - `Google`：Enabled にして、Google Cloud Console で OAuth 2.0 Client ID を作成し Client ID / Secret を貼り付け
   - `URL Configuration` → Site URL に公開 URL を追加
7. デプロイして、サインインを試す

> `.env.local` が無い状態では **ローカル demo モード**で動作します（認証をスキップ）。

## 📁 プロジェクト構成

```
teams-LABO/
├─ public/                PWA アイコン / favicon / og-image / robots / sitemap
├─ src/
│  ├─ components/         画面コンポーネント（auth/ 以下にサインイン関連）
│  ├─ hooks/              useAuth など
│  ├─ lib/                supabase / auth / seo / seed などのユーティリティ
│  ├─ store.ts            Zustand ストア（デモ自動クリア対応）
│  ├─ types.ts            共通型定義
│  ├─ App.tsx             アプリ本体（AuthGate でラップ）
│  ├─ main.tsx            エントリーポイント
│  └─ index.css           Tailwind + 共通スタイル
├─ supabase/migrations/   Supabase スキーマ + RLS + RPC
├─ vite.config.ts
├─ tailwind.config.js
└─ .github/workflows/     CI / デプロイ
```

## 📝 ライセンス

MIT
