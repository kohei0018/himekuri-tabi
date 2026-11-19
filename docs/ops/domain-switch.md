# 独自ドメイン（.com）に切り替える手順

サイトのURLは `astro.config.mjs` の `site` だけに書いてあり、環境変数 `SITE_URL` で上書きできる。canonical、OGP、sitemap、robots.txt はすべてそこから作られる。

費用：.com で年1,600円前後（Cloudflare Registrar は原価で、更新時も値上がりしない）。

## 手順

1. **ドメインを取る**：Cloudflareのダッシュボード → **Domain Registration** → **Register Domains** で `<名前>.com` を購入する
2. **カスタムドメインをつける**：**Workers & Pages** → `himekuri-tabi` → **Settings** → **Domains & Routes** → **Add** → **Custom domain** で `<名前>.com`（必要なら `www` も）を追加する。DNSは自動で設定される
3. **サイトのURLを変える**：`astro.config.mjs` の `site` の既定値を `https://<名前>.com` に変えるPRを作ってマージする（Claudeに頼めばよい）
   - 確認：`https://<名前>.com/robots.txt` の `Sitemap:` 行と、イベントページの `og:url` が新しいドメインになっている
4. **workers.dev から転送する**：友だちに貼った古いリンクを生かすため、`himekuri-tabi.idotworks-lab.workers.dev` へのアクセスを `https://<名前>.com` の同じパスとクエリへ **301** で転送する。Workers の入口に、ホスト名を見て転送する数行のコードを足す（Claudeに頼めばよい。`wrangler.jsonc` に `main` と `assets.run_worker_first` を足す形になる）
   - 確認：`https://himekuri-tabi.idotworks-lab.workers.dev/?when=2027-04&where=kyoto` が、新しいドメインの同じ結果に飛ぶ
5. **Search Console に登録する**：https://search.google.com/search-console で「ドメイン」プロパティとして `<名前>.com` を追加し、表示されたTXTレコードをCloudflareのDNSに追加して確認する。`https://<名前>.com/sitemap-index.xml` を送信する
6. **Web Analytics**：**Web Analytics** で `<名前>.com` を追加し、トークンが変わったら `src/config.ts` の `CF_BEACON_TOKEN` を更新する

## 戻すとき

`site` の既定値を戻し、転送のコードを外す。
