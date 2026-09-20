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
開発サーバーもCloudflare Viteプラグインを通してWorkersランタイムで動作します。

## コマンド

```bash
npm run lint        # OxlintとOxfmtによるチェック
npm run lint:fix    # lintの自動修正と整形
npm run format     # Oxfmtによる整形
npm run typecheck  # TypeScriptの型チェック
npm run build      # Workers用の本番ビルド
npm start          # ビルド済みWorkerをローカルで確認（port 3000）
npm run deploy:check # ビルド・デプロイのdry run（公開しない）
npm run deploy     # ビルドしてCloudflare Workersへ公開
```

## 構成

- [vinext](https://github.com/cloudflare/vinext) + Vite + React 19のApp Router。
- `app/layout.tsx`: HTML・日本語設定・Metadata API・グローバルCSS。
- `app/page.tsx`: トップページのServer Component。
- `components/Home.tsx`: イベント処理と地図の遅延読み込みを担うClient Component。
- 地図はWebGLを使用するため `next/dynamic` の `ssr: false` でブラウザ内で初期化。
- Tailwind CSS 4、Oxlint / Oxfmt、react-map-gl 8 + Mapbox GL JS 3。

Next.jsパッケージは不要です。App Routerの互換API・型はvinextが提供します。
vinextとCloudflareアダプターはベータ版のため検証したバージョンを固定しています。

## Cloudflare Workersへの公開

`wrangler.jsonc` と `vite.config.ts` がWorkers用の設定です。
Worker名は `chevron`。ビルドでサーバーとブラウザ向けアセットを生成し、
`dist/server/wrangler.json` が本番プレビュー・デプロイに使われます。
KV、R2、Cloudflare Imagesなどの追加サービスは不要です。

ローカルから初めて公開する場合:

```bash
npx wrangler login
npm run deploy
```

必要に応じて環境変数 `CLOUDFLARE_ACCOUNT_ID` でアカウントを指定します。
CIではGitHubリポジトリのActions Secretsに以下を設定してください。

- `CLOUDFLARE_API_TOKEN`: 対象アカウントのWorkersをデプロイできるAPIトークン。
- `CLOUDFLARE_ACCOUNT_ID`: 公開先のCloudflareアカウントID。
- `NEXT_PUBLIC_MAPBOX_TOKEN`: 地図表示用のMapbox公開トークン。

mainへのpushまたは手動実行で、lint・型チェック後にビルドしてWorkersへ公開します。
公開URLはデプロイログに出力されます。
PRのテストは認証不要のビルド・dry runまで実施します。

以前のGitHub Pages向け静的書き出しと `public/CNAME` は廃止しました。
`chevron.tokyo` を引き続き使う場合は、Cloudflareで対象ゾーンを管理し、
WorkerのSettings → Domains & RoutesからCustom Domainとして設定してください。
この設定変更だけでは既存ドメインのDNSやGitHub Pagesの公開状態は変更されません。
