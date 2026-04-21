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

データはすべてブラウザの localStorage に保存されます（無料ホスティングだけで完結）。

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

## 📁 プロジェクト構成

```
teams-LABO/
├─ public/                PWA アイコン / favicon
├─ src/
│  ├─ components/         画面コンポーネント
│  ├─ lib/                ユーティリティ
│  ├─ store.ts            Zustand ストア
│  ├─ types.ts            共通型定義
│  ├─ App.tsx             アプリ本体
│  ├─ main.tsx            エントリーポイント
│  └─ index.css           Tailwind + 共通スタイル
├─ vite.config.ts
├─ tailwind.config.js
└─ .github/workflows/     CI / デプロイ
```

## 📝 ライセンス

MIT
