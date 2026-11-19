# 独自ドメイン（.com）に切り替える手順

サイトのURLは `astro.config.mjs` の `site` だけに書いてあり、環境変数 `SITE_URL` で上書きできる。canonical、OGP、sitemap、robots.txt はすべてそこから作られるので、コードの変更は要らない。

費用：.com で年1,600円前後（Cloudflare Registrar は原価で、更新時も値上がりしない）。

## 手順

1. **ドメインを取る**：Cloudflareのダッシュボード → **Domain Registration** → **Register Domains** で `<名前>.com` を購入する
2. **カスタムドメインをつける**：Pagesの `himekuri-tabi` → **Custom domains** → **Set up a custom domain** で `<名前>.com`（必要なら `www` も）を追加する。DNSは自動で設定される
3. **サイトのURLを変える**：Pagesの **Settings** → **Environment variables** に `SITE_URL` = `https://<名前>.com` を追加（Production）して再デプロイする
   - 確認：`https://<名前>.com/robots.txt` の `Sitemap:` 行と、イベントページの `og:url` が新しいドメインになっている
4. **pages.dev から転送する**：ダッシュボード → **Rules** → **Bulk Redirects** で、`himekuri-tabi.pages.dev` から `https://<名前>.com` へ **301**、「パスとクエリを保持」にチェックを入れる（無料プランで使える）
   - 確認：友だちに貼った古いリンク（`https://himekuri-tabi.pages.dev/?when=2027-04&where=kyoto` など）が、新しいドメインの同じ結果に飛ぶ
5. **Search Console に登録する**：https://search.google.com/search-console で「ドメイン」プロパティとして `<名前>.com` を追加し、表示されたTXTレコードをCloudflareのDNSに追加して確認する。`https://<名前>.com/sitemap-index.xml` を送信する
6. **Web Analytics**：Pagesの Metrics で有効にしてあれば、カスタムドメインでもそのまま計測される

## 戻すとき

`SITE_URL` を消して再デプロイし、Bulk Redirects のルールを無効にする。
