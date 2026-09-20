# CHEVRON

人流データプラットフォーム。Mapboxの道路上に人・車の移動を描画します。

## 開発

Node.js 24以上とnpmを使用します（`.nvmrc` は24）。

```bash
npm ci
cp .env.local.sample .env.local
# .env.local の NEXT_PUBLIC_MAPBOX_TOKEN をMapboxの公開トークンに変更
npm run dev
```

http://localhost:3000 を開きます。地図の表示には有効なMapbox公開トークンが必要です。
`NEXT_PUBLIC_MAPBOX_TOKEN` はビルド時にブラウザ向けコードへ埋め込まれます。

## コマンド

```bash
npm run lint       # OxlintとOxfmtによるチェック
npm run lint:fix   # lintの自動修正と整形
npm run format    # Oxfmtによる整形
npm run typecheck # TypeScriptの型チェック
npm run build     # vinextの本番ビルド・静的書き出し
npm start         # 本番ビルドをローカルで確認
```

## 構成

- [vinext](https://github.com/cloudflare/vinext) + Vite + React 19。Pages Routerを使用。
- [Tailwind CSS](https://tailwindcss.com/docs/installation/using-vite) 4。
- [Oxlint / Oxfmt](https://oxc.rs/) によるlint・フォーマット。
- react-map-gl 8 + Mapbox GL JS 3。

Next.jsパッケージは不要です。`next/head` と `next/app` の互換API・型はvinextが提供します。
`next.config.js` はvinextが読み込む設定で、`output: 'export'` により静的ファイルを生成します。
vinextはベータ版のため、検証したバージョンを固定しています。

## 公開

`npm run build` の静的出力先は `dist/client/` です。
`public/CNAME`、画像、faviconもこのディレクトリにコピーされます。
GitHub Actionsはnpmでlint・型チェック・ビルドを実行し、mainへのpush時に
`dist/client/` を既存のGitHub Pages用ブランチへ公開します。
リポジトリのSecret `NEXT_PUBLIC_MAPBOX_TOKEN` を設定してください。
