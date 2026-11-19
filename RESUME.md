# 再開メモ（ひめくり旅）

最終更新：2026-11-19。作業を区切るたびに、このファイルの「今の状態」と「次にやること」を書き換える。

## 再開のしかた

- このフォルダで `claude` を起動する。`CLAUDE.md` が自動で読まれ、そこからこのファイルが読まれる
- 前の会話の続きから始めたいときは `claude --continue`（直前の会話）か `claude --resume`（一覧から選ぶ）
- 最初のひと言の例：「RESUME.md の次にやることから始めて」

## 今の状態

| 項目 | 状態 |
| --- | --- |
| 本番 | https://himekuri-tabi.idotworks-lab.workers.dev （Cloudflare Workers、mainへのプッシュで自動公開） |
| 中身 | 見本データ6件（`# SAMPLE: 未照合`）。京都の本番データは PR #1 で待ち |
| 公開範囲 | URLを知っていれば誰でも見られる。Search Console は未登録（.com に切り替えてから） |
| CI | GitHub Actions（型チェック・ユニットテスト87件・ビルド・ビルド後のテスト10件）＋Cloudflare Workers Builds。すべて成功 |
| 開いているPR | #1 京都府 2027年3〜5月のイベント（10件） |

## 次にやること（上から順に）

1. **PR #1 の「選んでください」13項目**をオーナーが選ぶ → Claude がファイルに反映して、`# verify-events … 済み` の見出しを消し、マージ
   - Claude のおすすめ：ギルバート＆ジョージ展は外す。ガイド媒体（るるぶ・JNTO）由来の動員数は basis を「推計」に
   - 見本の京都3件（葵祭・京都の桜・KYOTOGRAPHIE）はこのPRで置き換わる
2. **大阪・沖縄・北海道のデータPR**を1地域ずつ作る（手順は下の「データのPR」）。終わったら残りの見本（`naha-hari`、`osaka-tenjin-matsuri`、`sapporo-sakura`）も置き換わる
3. **アクセス解析**（必要になったら）：Cloudflare の Web Analytics → Add a site → `himekuri-tabi.idotworks-lab.workers.dev` → Manage site の `"token"` を Claude に伝える → `src/config.ts` の `CF_BEACON_TOKEN` に入れるPR
4. **毎月の日程の更新**：`refresh-dates` スキル（2027年の発表は年明けから）
5. その先（設計書 §1 の「やらないこと」から順に）：スマホ用カレンダー（週ごとのリスト）、海外の20〜30件、iCal、地図、.com への切り替え（`docs/ops/domain-switch.md`）

## 決まりごと

- **返事は日本語**
- **オーナーは調べない・書かない**。データの不確かな点は、PRの「選んでください」に A/B/C の選択肢で出す。「リンクを確認して」「地図で見て」は頼まない
- 運用費は年5,000円程度まで。MVPの間は0円
- 温度感：ゆるく続ける。ただし作り込むところは作り込んでよい
- main に直接コミットしない。ブランチ → PR

## データのPR（地域ごと）

1. `git switch -c data/<地域>-2027-spring`
2. サブエージェントで `draft-events` スキル（地域・期間 2027-03-01〜05-31）
3. **別の**サブエージェントで `verify-events` スキル（下書きを書いていないエージェント）
4. `npm test` / `npm run build` / `npm run test:build`
5. PR の本文：入れたもの・照合済み・選んでください・入れなかったもの（PR #1 の形）

## 知っておくと詰まらないこと

- **gh のトークンは PR を作れるが、マージできない**（Contents の書き込み権限がない）。オーナーに頼まれたら、手元で `git merge --no-ff origin/<branch>` して `git push origin main`（SSH の別名 `github-claude-dev`）。GitHub上もマージ済みになる
- **Cloudflare は Pages ではなく Workers**。設定は `wrangler.jsonc`（`build.command`、`assets.directory`、PRのプレビュー用の `"previews": {}`）。ダッシュボードに「Build output directory」はない
- サイトのURLは `astro.config.mjs` の `site` だけ（`SITE_URL` で上書き可）
- YAML の日付は必ず引用符で囲む（`'2027-05-03'`）。囲まないと Astro のビルドが落ちる
- `npm test` はユニットテストだけ（`vitest.config.ts`）。`dist/` を読むテストは `npm run test:build`（`vitest.build.config.ts`、ビルドのあと）
- 画面の確認：headless Edge は最小幅が492pxなので、390pxは iframe に入れて撮る。**`taskkill /IM msedge.exe` は禁止**（オーナーのブラウザまで閉じる）。自分で起動したものは CDP の `Browser.close` で閉じる
- Claude の環境からは `workers.dev` に接続できない。本番の見た目はオーナーにスマホで見てもらう

## 主なファイル

| ファイル | 中身 |
| --- | --- |
| `docs/himekuri-tabi_draft.md` | プロダクトのメモ（なぜ作るか、使われる場面、競合、未決事項） |
| `docs/superpowers/specs/2026-11-19-himekuri-tabi-mvp-design.md` | MVPの設計書（ここが正） |
| `docs/superpowers/plans/2026-11-19-himekuri-tabi-mvp.md` | MVPの実装計画（完了済み） |
| `docs/ops/cloudflare-setup.md` / `domain-switch.md` | 公開と .com 切り替えの手順 |
| `.claude/skills/` | `draft-events` / `verify-events` / `refresh-dates` |
| `docs/design/祭りカレンダー トップページ案.html` | デザイン案（元：https://claude.ai/artifact/R2RnNfJovArwXRgqUArk2H） |

## 後回しにした細かい指摘（最終レビューより）

- 混雑の印がカード単位で、どの日が混むかを書いていない
- 宿のリンクに日付・エリアがない（楽天の URL 形式を確認してから）
- URL から来たデータのない月が、選択肢に「2027-08」のまま出る
- 404 ページの canonical が `/404.html`
- 390px でカレンダーのイベント名が2〜3文字で切れる
