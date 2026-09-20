# CHEVRON

人流データプラットフォーム。OpenFreeMapの道路データ上に人・車の移動を描画します。

## 開発

Node.js 24以上とnpmを使用します（`.nvmrc` は24）。

```bash
npm ci
npm run dev
```

http://localhost:3000 を開きます。地図はOpenFreeMapから配信され、APIキーや環境変数は不要です。
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
- Tailwind CSS 4、Oxlint / Oxfmt、react-map-gl 8 + MapLibre GL JS 6。

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

mainへのpushまたは手動実行で、lint・型チェック後にビルドしてWorkersへ公開します。
公開URLはデプロイログに出力されます。
PRのテストは認証不要のビルド・dry runまで実施します。

以前のGitHub Pages向け静的書き出しと `public/CNAME` は廃止しました。
`chevron.tokyo` を引き続き使う場合は、Cloudflareで対象ゾーンを管理し、
WorkerのSettings → Domains & RoutesからCustom Domainとして設定してください。
この設定変更だけでは既存ドメインのDNSやGitHub Pagesの公開状態は変更されません。

## 地図データ

[OpenFreeMap](https://openfreemap.org/) のLibertyスタイルを使用します。
スタイル内の `openmaptiles` ソースの `transportation` レイヤーから道路を取得し、
スタイルに含まれる3D建物を表示します。人・車の動きは実測データではなくシミュレーションです。
地図の帰属表示（OpenFreeMap / OpenMapTiles / OpenStreetMap）はMapLibreの標準コントロールで表示します。
外部配信へのネットワーク接続が必要です。R2・D1は使用しません。
以前の `NEXT_PUBLIC_MAPBOX_TOKEN` Secretは不要になりました。
