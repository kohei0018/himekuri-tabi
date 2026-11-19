# Cloudflareで公開する手順（オーナーが1回だけ行う）

所要時間：15分ほど。費用：0円。公開は **Cloudflare Workers（静的アセット）** で行う。ビルドと公開の設定はリポジトリの `wrangler.jsonc` に書いてあるので、ダッシュボードで細かい設定をする必要はない。

## 1. アカウントを作る

1. https://dash.cloudflare.com/sign-up でアカウントを作る（無料プラン）

## 2. GitHubのリポジトリをつなぐ

1. ダッシュボードの **Workers & Pages** → **Create** → **Import a repository**
2. GitHubを連携し、`kohei0018/himekuri-tabi` だけにアクセスを許可する
3. 名前は `himekuri-tabi`（`wrangler.jsonc` の `name` と同じにする）。ビルドの設定は既定のままでよい
   - ビルドは `wrangler.jsonc` の `build.command`（`npm run build`）で行われ、`dist/` が公開される
   - 「Build output directory」の欄はない（Pagesとの違い）
4. 公開URLは `https://himekuri-tabi.idotworks-lab.workers.dev/`。以後、mainへのプッシュで本番に、PRごとにプレビューに自動で公開される
   - PRのプレビューには `wrangler.jsonc` の `"previews": {}` が必要（入れてある）

## 3. アクセス解析（Web Analytics）

Workersでは、Pagesのような自動の埋め込みは使えないので、トークンをコードに書く。

1. ダッシュボードの **Web Analytics** → **Add a site**
2. ホスト名に `himekuri-tabi.idotworks-lab.workers.dev` を入れて **Done**
3. **Manage site** に出るスクリプトの中の `"token": "…"` の値をClaudeに伝える（ページに埋め込まれる公開の値なので、伝えて問題ない）
4. Claudeが `src/config.ts` の `CF_BEACON_TOKEN` に入れてPRを作る。マージすると全ページに解析のスクリプトが入る（Cookieは使わない）

## 4. 確認

- `https://himekuri-tabi.idotworks-lab.workers.dev/` が開く
- `https://himekuri-tabi.idotworks-lab.workers.dev/events/kyoto-aoi-matsuri/` をLINEに貼ると、カード（タイトルと画像）が出る

Search Consoleへの登録は、.comに切り替えてから行う（`domain-switch.md`）。
