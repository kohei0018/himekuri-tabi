# Cloudflareで公開する手順（オーナーが1回だけ行う）

所要時間：15分ほど。費用：0円。

## 1. アカウントを作る

1. https://dash.cloudflare.com/sign-up でアカウントを作る（無料プラン）

## 2. GitHubのリポジトリをつなぐ

1. ダッシュボードの **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. GitHubを連携し、`kohei0018/himekuri-tabi` だけにアクセスを許可する
3. 設定を次のとおりにする

| 項目 | 値 |
| --- | --- |
| Project name | `himekuri-tabi`（公開URLが `himekuri-tabi.pages.dev` になる。後から変えない） |
| Production branch | `main` |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| 環境変数 | `NODE_VERSION` = `24` |

4. **Save and Deploy**。以後、mainへのプッシュで本番に、PRごとにプレビューURLに自動で公開される

## 3. アクセス解析（Web Analytics）

1. ダッシュボードの **Workers & Pages** → `himekuri-tabi` → **Metrics** タブ
2. Web Analytics の **Enable** を押す
3. 次のデプロイから、Cloudflareが解析のスクリプトを自動で全ページに入れる（Cookieは使わない）。トークンや環境変数の設定は要らない

（`PUBLIC_CF_BEACON_TOKEN` は、Pages以外で配信するとき用。Pagesでは設定しない。両方入れると二重に数えられる）

## 4. 確認

- `https://himekuri-tabi.pages.dev/` が開く
- `https://himekuri-tabi.pages.dev/events/kyoto-aoi-matsuri/` をLINEに貼ると、カード（タイトルと画像）が出る

Search Consoleへの登録は、.comに切り替えてから行う（`domain-switch.md`）。
