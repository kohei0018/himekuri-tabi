# ひめくり旅 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 「いつ」「どこ」を入れると旅行の“おまけ”になるイベントが出る静的サイトを、見本データ6件で動く状態まで作り、Cloudflareに出せるようにする。データ集めのスキルも用意する。

**Architecture:** Astroで静的サイトを生成する。イベントは `data/events/*.yaml`（1件1ファイル）で、ビルド時にzodで検査し、例年ルールから2027年の日付を計算して `/data/events.json` に出す。トップはそのJSONを読み、`src/lib/` の純粋な関数（検索・点数・ずらし・混雑）で結果を出す。1イベント1ページは静的HTMLでOGPつき。

**Tech Stack:** Node 24 / npm, Astro 5, TypeScript（strict）, zod（`astro/zod`）, Vitest, `@astrojs/sitemap`, `yaml`（テストのみ）, GitHub Actions, Cloudflare Pages

**Spec:** `docs/superpowers/specs/2026-11-19-himekuri-tabi-mvp-design.md`

## Global Constraints

- サービス名（表示）：`ひめくり旅`。公開URLの既定値：`https://himekuri-tabi.pages.dev`
- サイトのURLは `astro.config.mjs` の `site` だけに書く。環境変数 `SITE_URL` があればそれで上書き。canonical・`og:url`・`og:image`・sitemap・robots はすべて `Astro.site` から組み立てる。コードとデータにホスト名を直接書かない。ページ内リンクは相対パス
- 日付は `'YYYY-MM-DD'` の文字列で扱い、計算は UTC（`Date.UTC` / `getUTC*`）だけで行う。ローカル時刻の `Date` は使わない（JSTの手元とUTCのCIで結果がずれないため）
- 対象年：`2027`。データの期間：2027-03-01〜2027-05-31
- 定数は `src/config.ts` の1か所：`RADIUS_KM = 50`、`SIZE_DEFAULT = 10000`、`SIZE_STEPS = [10000, 100000, 1000000]`、`SHIFT_MAX_DAYS = 3`、`SHIFT_MAX_SUGGESTIONS = 2`、`CROWD_THRESHOLD = 1000000`、`TARGET_YEAR = 2027`、`RAKUTEN_AFFILIATE_ID = ''`
- 色：紺 `#1E2766`、主ボタン `#2B3A8C`、朱 `#D23F2A`、本文 `#1A1C2E`、補足 `#5A5E73`。確定バッジ `#E8EBF8`/`#2B3A8C`、推定・平年値バッジ `#FFF1EC`/`#A8321F` ＋ `1px dashed #E3866F`
- フォント：本文 Noto Sans JP、見出し Zen Kaku Gothic New（Google Fonts）
- タッチの対象は44px以上。基準幅はスマホ390px。UIの文言は日本語
- 追加の有料サービスを使わない（運用費0円）。ランタイムの依存は `astro` と `@astrojs/sitemap` だけ
- ブラウザで動くJSはトップページだけ。素のTypeScript（UIライブラリなし）【計画での判断】

## Review Focus

1. **月の境目・データのない月**：`when=2027-08` のようにデータがない月や、`2027-03-30..2027-04-02` のように月をまたぐ期間でも落ちずに、空なら「この時期のイベントはまだありません」を出す → Task 5 にテストを追加
2. **飛び飛びの日程が期間に一部だけかかる**：祇園祭の神輿洗（7/10・7/28）のような複数の範囲のうち1つでも期間に重なれば出し、重なった日だけを表示に使う → Task 5
3. **一部だけ不正なURL**：`?when=2027-04&where=nowhere` は「いつだけ」として扱う（`where` だけ捨てる） → Task 5
4. **エリアの重なり**：周辺50kmが重なるエリア同士で、同じイベントが「両方」の結果に二重に出ない → Task 5
5. **境界の日**：イベントの終了日＝出発日、開始日＝帰着日でも「かぶる」に入る（両端を含む） → Task 5、ずらしでも同じ → Task 6

---

## File Structure

```
astro.config.mjs            site・sitemap・出力設定
package.json / tsconfig.json / vitest.config.ts / .gitignore / .nvmrc
.github/workflows/ci.yml    型チェック・テスト・ビルド
src/config.ts               定数（Global Constraints）
src/lib/types.ts            型（EventFile, Rule, Occurrence, BloomInfo, Area, ResolvedEvent, DateRange, Query, SearchResult）
src/lib/schema.ts           zodスキーマ（eventFileSchema, areaSchema）
src/lib/day.ts              'YYYY-MM-DD' の加算・比較・曜日・範囲の重なり
src/lib/holidays.ts         2027年の祝日
src/lib/dates.ts            例年ルール → 日付、見頃の期間、イベント1件の解決
src/lib/geo.ts              距離
src/lib/score.ts            おまけ度
src/lib/query.ts            URLの読み書き
src/lib/search.ts           search()
src/lib/shift.ts            日程ずらし
src/lib/crowd.ts            混雑の日
src/lib/links.ts            宿・検索・カードのリンク
src/lib/resolve.ts          コレクション → ResolvedEvent[]
src/content.config.ts       content collections（events, areas）
src/pages/data/events.json.ts
src/pages/index.astro  src/client/app.ts  src/client/render.ts
src/pages/events/[id].astro  src/pages/about.astro  src/pages/404.astro  src/pages/robots.txt.ts
src/layouts/Base.astro  src/styles/global.css
public/og-default.png
data/events/*.yaml（見本5件）  data/areas.yaml
tests/*.test.ts  tests/build/*.test.ts
docs/ops/cloudflare-setup.md  docs/ops/domain-switch.md
.claude/skills/draft-events/SKILL.md  verify-events/SKILL.md  refresh-dates/SKILL.md
```

---

### Task 1: プロジェクトの土台とCI

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.nvmrc`, `.github/workflows/ci.yml`, `src/config.ts`, `src/pages/index.astro`（仮の1行）, `tests/config.test.ts`

**Interfaces:**
- Produces: `npm run check`（`astro check`）、`npm test`（`vitest run tests --exclude tests/build`）、`npm run build`（`astro build`）、`npm run test:build`（`vitest run tests/build`）。`src/config.ts` の定数（Global Constraints の値そのまま）

- [ ] **Step 1:** `npm create astro@latest`（minimal, TypeScript strict）相当の構成を手で作り、`astro`・`@astrojs/sitemap`・`@astrojs/check`・`typescript`・`vitest`・`yaml` を入れる。`.nvmrc` は `24`
- [ ] **Step 2:** `astro.config.mjs`：`site: process.env.SITE_URL ?? 'https://himekuri-tabi.pages.dev'`、`output: 'static'`、`trailingSlash: 'always'`、`integrations: [sitemap()]`
- [ ] **Step 3: 失敗するテストを書く** `tests/config.test.ts`

```ts
import * as c from '../src/config';
test('constants match spec', () => {
  expect(c.RADIUS_KM).toBe(50);
  expect(c.SIZE_STEPS).toEqual([10000, 100000, 1000000]);
  expect(c.SHIFT_MAX_DAYS).toBe(3);
  expect(c.CROWD_THRESHOLD).toBe(1000000);
  expect(c.TARGET_YEAR).toBe(2027);
});
```
- [ ] **Step 4:** `npm test` → FAIL（config がない）。`src/config.ts` を書く → PASS
- [ ] **Step 5:** `ci.yml`：push と pull_request で `npm ci` → `npm run check` → `npm test` → `npm run build` → `npm run test:build`（Node は `.nvmrc`）
- [ ] **Step 6:** `npm run check && npm test && npm run build` がすべて成功することを確認
- [ ] **Step 7: Commit** `chore: scaffold Astro project with Vitest and CI`

### Task 2: 型とスキーマ

**Files:**
- Create: `src/lib/types.ts`, `src/lib/schema.ts`, `tests/schema.test.ts`

**Interfaces:**
- Produces:
  - `type DateStr = string`（'YYYY-MM-DD'）、`type DateRange = { start: DateStr; end: DateStr }`
  - `type Rule = { type: 'fixed'; month: number; day: number; length?: number } | { type: 'nth_weekday'; month: number; weekday: 0|1|2|3|4|5|6; n: 1|2|3|4|5|-1; length?: number } | { type: 'holiday_relative'; holiday: string; offset: number; length?: number } | { type: 'manual' }`（`weekday` は 0=日、`holiday` は祝日名、`offset` は日数）
  - `type Status = 'confirmed' | 'estimated' | 'normal'`
  - `type Occurrence = { year: number; status: Status; dates?: DateRange[]; source_url?: string; note?: string }`
  - `type BloomInfo = { station: string; flowering: string; full_bloom: string; forecast_url: string }`（'MM-DD'）
  - `type EventFile`：設計書 5.2 のYAMLの形（`kind: 'event'|'bloom'|'exhibition'`、`rules?: Rule[]`、`bloom?: BloomInfo`、`attendance?: { value: number; basis: string; source_url: string }`、`occurrences: Occurrence[]` ほか）
  - `type Area = { id: string; name: string; prefecture: string; lat: number; lng: number }`
  - `type ResolvedEvent = Omit<EventFile, 'rules'|'occurrences'|'bloom'> & { dates: DateRange[]; status: Status; ruleText?: string; sourceUrl?: string; forecastUrl?: string }`
  - `eventFileSchema`, `areaSchema`（zod、`import { z } from 'astro/zod'`）

- [ ] **Step 1: 失敗するテストを書く** `tests/schema.test.ts`。正しい見本（葵祭の形）が通ること、そして以下が**失敗**すること：
  - `kind: 'event'` で `attendance` がない
  - `status: 'confirmed'` で `dates` か `source_url` がない
  - `kind: 'bloom'` で `bloom` がない
  - `kind: 'bloom'` か `'exhibition'` で `attendance` がある
  - `id` に英小文字・数字・ハイフン以外（`/^[a-z0-9]+(-[a-z0-9]+)*$/`）
  - `rule.type: 'manual'` だけなのに、対象年の `occurrences[].dates` がない
  - `dates` の `end < start`
- [ ] **Step 2:** `npx vitest run tests/schema.test.ts` → FAIL
- [ ] **Step 3:** `types.ts` と `schema.ts` を書く（条件つきの必須は `superRefine`）。型は `z.infer` と一致させる
- [ ] **Step 4:** PASS を確認
- [ ] **Step 5: Commit** `feat: add event and area schema`

### Task 3: 日付の計算（例年ルール・祝日・見頃）

**Files:**
- Create: `src/lib/day.ts`, `src/lib/holidays.ts`, `src/lib/dates.ts`, `tests/day.test.ts`, `tests/dates.test.ts`

**Interfaces:**
- Consumes: Task 2 の型
- Produces:
  - `day.ts`：`addDays(d: DateStr, n: number): DateStr`、`diffDays(a: DateStr, b: DateStr): number`（b−a）、`weekday(d: DateStr): number`、`overlaps(a: DateRange, b: DateRange): boolean`（両端を含む）、`eachDay(r: DateRange): DateStr[]`、`monthRange(ym: string): DateRange`（'YYYY-MM'）
  - `holidays.ts`：`HOLIDAYS_2027: Record<DateStr, string>`、`findHoliday(name: string, year: number): DateStr | undefined`
  - `dates.ts`：`resolveRule(rule: Rule, year: number): DateRange[]`、`bloomRange(b: BloomInfo, year: number): DateRange`、`resolveDates(e: EventFile, year: number): { dates: DateRange[]; status: Status } | null`（対象年の日程がなければ null）、`ruleText(rules: Rule[]): string`（例：「毎年5月15日」「7月の最終土曜」「海の日の前日から2日間」）

- [ ] **Step 1: 失敗するテストを書く**
  - `weekday('2027-07-31') === 6`、`addDays('2027-02-28', 1) === '2027-03-01'`、`overlaps({start:'2027-04-01',end:'2027-04-03'},{start:'2027-04-03',end:'2027-04-05'}) === true`
  - `resolveRule({type:'fixed',month:5,day:15}, 2027)` → `[{start:'2027-05-15',end:'2027-05-15'}]`
  - `resolveRule({type:'nth_weekday',month:7,weekday:6,n:-1}, 2027)` → `2027-07-31`
  - `resolveRule({type:'nth_weekday',month:7,weekday:1,n:3}, 2027)` → `2027-07-19`
  - `resolveRule({type:'holiday_relative',holiday:'海の日',offset:-1,length:2}, 2027)` → `{start:'2027-07-18',end:'2027-07-19'}`
  - `resolveRule({type:'fixed',month:7,day:24,length:2}, 2027)` → `{start:'2027-07-24',end:'2027-07-25'}`
  - `resolveRule({type:'manual'}, 2027)` → `[]`
  - `bloomRange({flowering:'03-26',full_bloom:'04-04',...}, 2027)` → `{start:'2027-03-26',end:'2027-04-11'}`（満開の7日後まで）
  - `resolveDates`：`occurrences` の対象年に `dates` があればそれを使いその `status`、なければ `rules` を全部計算して合わせて `estimated`、`bloom` は `normal`、対象年の `occurrences` がなく `manual` なら `null`
  - `findHoliday('春分の日', 2027) === '2027-03-21'`、`HOLIDAYS_2027['2027-03-22'] === '休日'`
- [ ] **Step 2:** FAIL を確認
- [ ] **Step 3:** 実装する。`HOLIDAYS_2027` は次の17日。**書く前に内閣府の一覧（https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html の「令和9年」）と突き合わせ**、違えば内閣府に合わせてテストも直す：
  `01-01 元日, 01-11 成人の日, 02-11 建国記念の日, 02-23 天皇誕生日, 03-21 春分の日, 03-22 休日, 04-29 昭和の日, 05-03 憲法記念日, 05-04 みどりの日, 05-05 こどもの日, 07-19 海の日, 08-11 山の日, 09-20 敬老の日, 09-23 秋分の日, 10-11 スポーツの日, 11-03 文化の日, 11-23 勤労感謝の日`
- [ ] **Step 4:** PASS を確認
- [ ] **Step 5: Commit** `feat: resolve yearly date rules and bloom ranges`

### Task 4: 距離と点数

**Files:**
- Create: `src/lib/geo.ts`, `src/lib/score.ts`, `tests/geo.test.ts`, `tests/score.test.ts`

**Interfaces:**
- Produces: `distanceKm(a: {lat:number;lng:number}, b: {lat:number;lng:number}): number`（haversine、地球半径6371km）、`eventScore(e: ResolvedEvent): number`（`attendance` 1万〜:1、10万〜:2、100万〜:3、`bloom`/`exhibition`:1、1万未満:0）、`passesSize(e: ResolvedEvent, size: number): boolean`（`attendance` がない種類は常に true）

- [ ] **Step 1: 失敗するテストを書く**：京都市役所（35.0116, 135.7681）〜大阪天満宮（34.6957, 135.5126）が 40〜45km、京都〜札幌（43.0621, 141.3544）が 900km超。点数：3万→1、50万→2、120万→3、bloom→1。`passesSize`：3万人で size=100000 → false、bloom で size=1000000 → true
- [ ] **Step 2:** FAIL → **Step 3:** 実装 → **Step 4:** PASS
- [ ] **Step 5: Commit** `feat: add distance and score helpers`

### Task 5: URLと検索

**Files:**
- Create: `src/lib/query.ts`, `src/lib/search.ts`, `tests/query.test.ts`, `tests/search.test.ts`, `tests/fixtures.ts`（テスト用の ResolvedEvent と Area を数件）

**Interfaces:**
- Consumes: Task 3 `overlaps`, `monthRange`；Task 4 `distanceKm`, `eventScore`, `passesSize`
- Produces:
  - `type When = { kind: 'month'; month: string } | { kind: 'range'; range: DateRange }`
  - `type Query = { when?: When; where?: string; size: number }`
  - `parseQuery(p: URLSearchParams, areaIds: string[]): Query`（不正な値はその項目だけ捨てる。`size` は `SIZE_STEPS` にない値なら `SIZE_DEFAULT`）
  - `toSearchParams(q: Query): URLSearchParams`（既定値の `size` は書かない。順序は when, where, size）
  - `eventsNear(area: Area, events: ResolvedEvent[]): ResolvedEvent[]`（`RADIUS_KM` 以内）
  - `type Hit = { event: ResolvedEvent; days: DateRange[] }`（期間に重なった範囲だけ）
  - `type SearchResult = { mode: 'upcoming'; hits: Hit[] } | { mode: 'candidates'; period: DateRange; areas: { area: Area; score: number; hits: Hit[] }[] } | { mode: 'calendar'; area: Area; months: { month: string; hits: Hit[] }[] } | { mode: 'overlap'; area: Area; period: DateRange; hits: Hit[] }`
  - `search(q: Query, events: ResolvedEvent[], areas: Area[], today: DateStr): SearchResult`

- [ ] **Step 1: 失敗するテストを書く** `tests/query.test.ts`
  - `?when=2027-04&where=kyoto` → month と where
  - `?when=2027-04-01..2027-04-05` → range
  - `?when=2027-13`、`?when=2027-04-05..2027-04-01`（逆順）、`?where=nowhere`、`?size=5` → その項目は空／既定値（Review Focus 3）
  - `toSearchParams(parseQuery(x))` が同じ文字列に戻る（往復）
- [ ] **Step 2: 失敗するテストを書く** `tests/search.test.ts`（設計書 4.1 の表の各行）
  - 何もない → `upcoming`：`today` 以降に始まるか続いているものを日付順
  - いつだけ（月）→ `candidates`：エリアの並びは点数の合計の降順、同点は件数、次にエリアの一覧の順。各エリアの hits は点数の降順
  - どこだけ → `calendar`：データのある月（TARGET_YEAR の 3〜5月で hits がある月）ごと
  - 両方（期間）→ `overlap`：期間に重なるものだけ
  - 両方（月）→ `calendar`（その月だけ）
  - `size=100000` で3万人のイベントが消え、bloom は残る
  - 京都エリアで大阪の天神祭（約43km）が入り、札幌のイベントは入らない
  - Review Focus 1：`when=2027-08` → `candidates` で `areas: []`；`2027-03-30..2027-04-02` で 3月末と4月頭のイベントが両方入る
  - Review Focus 2：範囲が `[7/10, 7/28]` のイベントは、期間 7/25〜7/30 で `days` が `[7/28]` だけ
  - Review Focus 4：同じイベントが重なる2エリアに入っても、`overlap` の hits では1回だけ
  - Review Focus 5：イベントの終了日＝期間の開始日で hit になる
- [ ] **Step 3:** FAIL → **Step 4:** 実装 → **Step 5:** PASS
- [ ] **Step 6: Commit** `feat: add query parsing and search`

### Task 6: 日程ずらしと混雑の日

**Files:**
- Create: `src/lib/shift.ts`, `src/lib/crowd.ts`, `tests/shift.test.ts`, `tests/crowd.test.ts`

**Interfaces:**
- Consumes: Task 3 `addDays`, `overlaps`；Task 4 `eventScore`；Task 5 `Hit`
- Produces:
  - `type Shift = { offset: number; range: DateRange; added: Hit[] }`（offset は負で前へ）
  - `suggestShifts(period: DateRange, events: ResolvedEvent[]): Shift[]`（`events` はすでにエリアと規模で絞ったもの。offset は ±1〜±`SHIFT_MAX_DAYS`。今の期間にかからず、ずらした期間にかかるものが `added`。added の点数の合計の降順、同点は |offset| の小さい順、さらに同じなら前へずらすほうを先。最大 `SHIFT_MAX_SUGGESTIONS` 件。added が空のものは出さない）
  - `crowdedDays(period: DateRange, events: ResolvedEvent[]): DateStr[]`（`attendance.value >= CROWD_THRESHOLD` のイベントが開かれている、期間内の日。昇順・重複なし）
  - `shiftLabel(s: Shift): string`（「3日前にずらすと（4/1〜4/5）」「2日後にずらすと（…）」）

- [ ] **Step 1: 失敗するテストを書く**
  - 期間 7/20〜7/22（3日）、7/17 に大きなイベント → offset −3、range 7/17〜7/19、added にそのイベント
  - 新しく入るものがない → `[]`
  - 候補が3つ以上でも2件まで。点数が同じなら |offset| が小さいほう
  - 境界：ずらした期間の最終日＝イベントの開始日でも added に入る（Review Focus 5）
  - `crowdedDays`：120万人の 7/24〜7/25 と期間 7/23〜7/24 → `['2027-07-24']`；50万人だけなら `[]`
  - `shiftLabel` の文言が上のとおり
- [ ] **Step 2:** FAIL → **Step 3:** 実装 → **Step 4:** PASS
- [ ] **Step 5: Commit** `feat: add date shift suggestions and crowded days`

### Task 7: 見本データ、コレクション、events.json

**Files:**
- Create: `data/areas.yaml`, `data/events/kyoto-aoi-matsuri.yaml`, `data/events/osaka-tenjin-matsuri.yaml`, `data/events/naha-hari.yaml`, `data/events/kyoto-sakura.yaml`, `data/events/sapporo-sakura.yaml`, `data/events/osaka-teamlab-botanical.yaml`（6件、kind 3種類すべて）, `src/content.config.ts`, `src/lib/resolve.ts`, `src/pages/data/events.json.ts`, `tests/data.test.ts`, `tests/build/events-json.test.ts`

**Interfaces:**
- Consumes: Task 2 スキーマ、Task 3 `resolveDates`, `ruleText`
- Produces: `toResolved(files: EventFile[], year: number): ResolvedEvent[]`（null は除き、最初の日付の昇順）。`/data/events.json` = `{ year: number; areas: Area[]; events: ResolvedEvent[] }`。コレクション名 `events`、`areas`（`glob({ pattern: '*.yaml', base: './data/events' })`、areas は `file('data/areas.yaml')`）

- [ ] **Step 1:** `data/areas.yaml` に設計書 4.4 の13エリア（京都市、嵐山・嵯峨野、大阪市、USJ・ベイエリア、那覇、本部・美ら海、石垣、札幌、小樽、函館、旭川・富良野、帯広、ニセコ）を ID・名前・都道府県・中心の緯度経度で書く
- [ ] **Step 2:** 見本のYAMLを書く。値は公開情報から入れてよいが、**ファイル先頭に `# SAMPLE: 未照合。本番データのPRで置き換える` と書く**。天神祭は期間外（7月）だが、ずらし・混雑・50kmの確認用に入れる
- [ ] **Step 3: 失敗するテストを書く** `tests/data.test.ts`：`data/events/*.yaml` と `data/areas.yaml` をすべて `yaml` で読み、スキーマに通ること。ファイル名＝`id` であること。エリアのIDが重複しないこと
- [ ] **Step 4:** `tests/build/events-json.test.ts`：`dist/data/events.json` を読み、`year === 2027`、イベント6件、`kyoto-aoi-matsuri` の dates が `2027-05-15`、`kyoto-sakura` の status が `normal`
- [ ] **Step 5:** 実装（`content.config.ts`、`resolve.ts`、エンドポイント）→ `npm test && npm run build && npm run test:build` が PASS
- [ ] **Step 6: Commit** `feat: add sample data and events.json endpoint`

### Task 8: 共通レイアウトと1イベント1ページ

**Files:**
- Create: `src/layouts/Base.astro`, `src/styles/global.css`, `src/lib/links.ts`, `src/pages/events/[id].astro`, `public/og-default.png`（1200×630、紺の地に「ひめくり旅」と一行の説明）, `tests/links.test.ts`, `tests/build/event-page.test.ts`

**Interfaces:**
- Consumes: Task 7 コレクションと `toResolved`；Task 3 `ruleText`
- Produces:
  - `Base.astro` の props：`{ title: string; description: string; path: string; image?: string }`。`<title>`、description、canonical、`og:title/description/url/image/type/site_name`、`twitter:card=summary_large_image` を `new URL(path, Astro.site)` で出す。Cloudflare Web Analytics のスクリプトは環境変数 `PUBLIC_CF_BEACON_TOKEN` があるときだけ入れる
  - `links.ts`：`searchLinkFor(e: ResolvedEvent, areas: Area[]): string`（相対パス `/?when=<最初の開催月>&where=<最寄りのエリア>`）、`hotelLink(e: ResolvedEvent, range?: DateRange): string`（楽天トラベルのエリア・日付つき検索URL。正確な形式は実装時に楽天トラベルで確認する。`RAKUTEN_AFFILIATE_ID` が空ならアフィリエイトなしの普通のURL、あれば楽天アフィリエイトの形式で包む）、`statusLabel(s: Status): '確定'|'推定'|'平年値'`
- `global.css`：Global Constraints の色をCSS変数に。バッジ（`.badge-confirmed` / `.badge-estimated`）、ボタン、カード

- [ ] **Step 1: 失敗するテストを書く** `tests/links.test.ts`：天神祭の `searchLinkFor` が `/?when=2027-07&where=osaka` で始まる（大阪市が最寄り）、`statusLabel('normal') === '平年値'`、`hotelLink` が `RAKUTEN_AFFILIATE_ID=''` で `https://travel.rakuten.co.jp/` から始まる
- [ ] **Step 2:** `tests/build/event-page.test.ts`：`dist/events/kyoto-aoi-matsuri/index.html` に `<title>葵祭` と、`og:url` が `https://himekuri-tabi.pages.dev/events/kyoto-aoi-matsuri/`。`SITE_URL=https://example.com npm run build` のあとでは `https://example.com/...` になる（ホスト名を直接書いていないことの確認）
- [ ] **Step 3:** FAIL → **Step 4:** 実装。ページの中身は設計書 4.3 の項目の順。推定と平年値は点線のバッジに `ruleText` を添え、見頃は開花予想へのリンクと「出典：気象庁」
- [ ] **Step 5:** PASS を確認。`npm run dev` で葵祭と京都の桜のページを390px幅で見て、デザイン案（`docs/design/祭りカレンダー トップページ案.html` のスマホ版のカード）と色・バッジ・余白が合っていることを確認
- [ ] **Step 6: Commit** `feat: add base layout and event pages`

### Task 9: トップページ（フォームと結果）

**Files:**
- Create: `src/pages/index.astro`（置き換え）, `src/client/app.ts`, `src/client/render.ts`, `tests/render.test.ts`

**Interfaces:**
- Consumes: Task 5 `parseQuery`, `toSearchParams`, `search`, `eventsNear`；Task 6 `suggestShifts`, `crowdedDays`, `shiftLabel`；Task 8 `links.ts`, `statusLabel`；`/data/events.json`
- Produces: `render.ts`：`renderResult(r: SearchResult, extras: { shifts: Shift[]; crowded: DateStr[] }): string`（HTML文字列。イベント名などは必ずエスケープ）

- [ ] **Step 1:** `index.astro`：デザイン案のスマホ版の上半分（紺の帯、見出し「その旅行、祭りとかぶってる？」、白いフォーム）。フォームは「いつ」（月の `<select>`：2027年3月〜5月＋「期間を指定」で出発日・帰着日の `<input type="date">`）、「どこ」（エリアの `<select>`、空の選択肢「どこでも」）、規模のボタン3つ（`aria-pressed`）、「探す」。JSがなくても、フォームのGET送信で同じURLになる
- [ ] **Step 2: 失敗するテストを書く** `tests/render.test.ts`
  - `overlap` で shifts があると「3日前にずらすと」と「この日程で探す」のリンク（`?when=…` 付き）が出る
  - `crowded` に日があると、その日のイベントのカードに「宿が埋まりやすい日」
  - `candidates` が空なら「この時期のイベントはまだありません」
  - `calendar` は月ごとの7列のグリッド（日曜始まり）。1日に3件あれば点数の高い2件と「+1件」、日付のボタンを押すとその日の一覧（デザイン案のカレンダー画面と同じ）
  - 名前に `<script>` を含むイベントがエスケープされる
  - 推定のカードに点線のバッジのクラスが付く
- [ ] **Step 3:** FAIL → **Step 4:** `render.ts` を実装 → PASS
- [ ] **Step 5:** `app.ts`：読み込み時に `/data/events.json` を取り、`location.search` を `parseQuery` → `search` → `overlap` なら `suggestShifts` と `crowdedDays` も → `renderResult`。フォームを変えたら `history.replaceState` で URL を `toSearchParams` の形に更新して再描画（ページ遷移なし）。`today` はブラウザの日付を 'YYYY-MM-DD' にしたもの
- [ ] **Step 6:** `npm run dev` で確認（390px幅）：`/?when=2027-04` で行き先の候補、`/?where=kyoto` でカレンダー、`/?when=2027-05-13..2027-05-16&where=kyoto` で葵祭がかぶる、`/?when=2027-05-16..2027-05-18&where=kyoto` で「1日前にずらすと」の提案。URLをコピーして別のタブで開き、同じ結果になること
- [ ] **Step 7: Commit** `feat: add search form and results on top page`

### Task 10: 付属ページ、SEO、運用の手順書

**Files:**
- Create: `src/pages/about.astro`, `src/pages/404.astro`, `src/pages/robots.txt.ts`, `docs/ops/cloudflare-setup.md`, `docs/ops/domain-switch.md`, `tests/build/seo.test.ts`

**Interfaces:**
- Consumes: Task 8 `Base.astro`

- [ ] **Step 1: 失敗するテストを書く** `tests/build/seo.test.ts`：`dist/robots.txt` に `Sitemap: https://himekuri-tabi.pages.dev/sitemap-index.xml`、`dist/sitemap-0.xml` に `/events/kyoto-aoi-matsuri/` が含まれる、`dist/404.html` がある、`dist/about/index.html` に「気象庁」と「推計値」
- [ ] **Step 2:** FAIL → **Step 3:** 実装。`/about/` は設計書 4.8 の中身（動員数は主催者発表などの推計値、推定・平年値の意味、出典：気象庁ホームページ（政府標準利用規約に従う）、問い合わせはGitHubのIssues）→ PASS
- [ ] **Step 4:** `docs/ops/cloudflare-setup.md`：オーナーが行う手順（Cloudflareのアカウント作成 → Workers & Pages でGitHubの `kohei0018/himekuri-tabi` を接続 → プロジェクト名 `himekuri-tabi`、ビルドコマンド `npm run build`、出力 `dist`、環境変数 `NODE_VERSION=24` → Web Analytics を有効化して `PUBLIC_CF_BEACON_TOKEN` を設定）
- [ ] **Step 5:** `docs/ops/domain-switch.md`：設計書 7章の切り替えの手順（ドメイン取得 → カスタムドメイン → `SITE_URL` を設定 → `pages.dev` からの301（Bulk Redirects）→ Search Console 登録と sitemap 送信）
- [ ] **Step 6: Commit** `feat: add about, 404, robots and ops docs`

### Task 11: データ集めのスキル

**Files:**
- Create: `.claude/skills/draft-events/SKILL.md`, `.claude/skills/verify-events/SKILL.md`, `.claude/skills/refresh-dates/SKILL.md`

**Interfaces:**
- Consumes: Task 2 のスキーマ、Task 7 の `tests/data.test.ts`（下書きの検査に使う）

- [ ] **Step 1:** superpowers:writing-skills に沿って3つを書く。共通の決まり：オーナーは調べない・書かない（設計書 5.5）。すべての値に出典のURL
  - `draft-events`：入力は地域と期間。線引き（設計書 5.1：動員1万人以上、展示は人が選ぶ候補として理由つき、常設は除外、ライブ・試合は除外）とスキーマ 5.2 を守った YAML を `data/events/` に書き、`npm test` を通す
  - `verify-events`：下書きを書いていない別のサブエージェントで動かす。各ファイルの日程・場所・動員数を、出典のページだけで照合する。結果は「照合済み」と「印つき（食い違い／出典なし／推計）」に分け、印つきは PR の説明に貼れる選択肢の形（例：`動員数：A. 報道の3万人を使う　B. このイベントを外す`）で返す
  - `refresh-dates`：`status: estimated` の対象年のイベントの公式サイトを調べ直し、発表があれば `confirmed`＋`dates`＋`source_url` に変え、`verify-events` を通して PR を作る。PR の説明に「まだ推定のもの」の一覧
- [ ] **Step 2:** 試す：見本の葵祭と那覇ハーリーで `draft-events` → `verify-events` を実際に動かし、出力の形（YAML がスキーマに通る、選択肢つきの一覧が出る）を確認。問題があればスキルを直す
- [ ] **Step 3: Commit** `feat: add data drafting and verification skills`

---

## 実装後（この計画の範囲外）

- オーナー：`docs/ops/cloudflare-setup.md` の手順（15分ほど）
- 地域ごとのデータのPR（京都・大阪・沖縄・北海道）を `draft-events` → `verify-events` で作り、見本データを置き換える
- MVPの完成の判定：この計画の完了＋4地域のデータのマージ
