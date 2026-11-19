---
name: draft-events
description: Use when adding or re-researching himekuri-tabi event data — a region and period (e.g. 京都・2027年3〜5月) or named events need YAML files in data/events/, before opening a data PR
---

# draft-events

Research events on the web and write `data/events/<id>.yaml` drafts that pass the schema and are ready for `verify-events`. The owner never researches or writes: anything uncertain becomes a **flag with choices**, not a task for the owner.

Spec: `docs/superpowers/specs/2026-11-19-himekuri-tabi-mvp-design.md` §5. Schema: `src/lib/schema.ts`.

## What goes in (spec §5.1)

| Include | Exclude |
| --- | --- |
| 祭り、花火、グルメ・物産、ライトアップ、伝統行事 with 動員1万人以上 | 動員1万人未満 |
| 季節の見頃（桜）: one per area, from 気象庁の平年値 | Okinawa sakura (Jan–Feb, outside Mar–May) |
| 期間限定の展示 (special exhibitions, seasonal installations) — as **candidates with a one-line reason**, the owner picks | 常設の施設・観光スポット (permanent, same any day) |
| | ライブ、スポーツの試合 (performer/match is the star) |

## Each file: the contract

```yaml
# DRAFT <today>: verify-events 前
id: kyoto-aoi-matsuri            # == file name, lowercase-kebab, same id every year
name: 葵祭
kind: event                      # event | bloom | exhibition
genre: [伝統行事]
country: JP
region: domestic
prefecture: 京都府
city: 京都市
lat: 35.0236                     # from a source (official access map, Wikipedia infobox, Google Maps place page) — else flag
lng: 135.7625
nearest: { city: 京都市, airport: ITM }
summary: 1〜2文。何が見られるか。日程や会場の変更予定は note へ
official_url: https://...        # the organizer's page; if none exists, the closest public page + flag
attendance:                      # kind: event only, required
  value: 35000
  basis: 警察発表                # one of: 主催者発表 / 警察発表 / 報道 / 推計
  source_url: https://...        # the page that states the number
rules:                           # how the date repeats (not for bloom)
  - { type: fixed, month: 5, day: 15 }
occurrences:
  - year: 2027
    status: estimated            # no dates when rules can compute them
    note: 雨天順延あり。2027年の公式発表は未確認
```

- **Quote every full date**: `{ start: '2027-05-03', end: '2027-05-05' }`. Bare `2027-05-03` is parsed as a Date by Astro and breaks the build.
- `status: confirmed` only when a page **announces this year's date**: then `dates` and `source_url` (that announcement) are both required.
- `status: estimated`: leave `dates` out when `rules` compute them. Put `dates` only with `rules: [{ type: manual }]` (lunar calendar, irregular), and flag it.
- bloom: no `rules`/`attendance`; `bloom: { station, flowering: 'MM-DD', full_bloom: 'MM-DD', forecast_url: https://tenki.jp/sakura/ }` from 気象庁 平年値 (1991–2020); `occurrences: [{ year: 2027, status: normal }]`.
- Rule types: `fixed`(month, day, length?), `nth_weekday`(month, weekday 0=日, n 1–5 or -1=最終, length?), `holiday_relative`(holiday name as in `src/lib/holidays.ts`, offset, length?), `manual`.

## Flags

A flag is anything a source does not state directly, or sources disagree on. Every flag has a short label and 2–3 lettered choices; the first choice is your recommendation. Each choice is a value or an action that can be applied to the file as-is ("use 50,500", "drop the event", "keep the note") — "research more" is never a choice: do that research before reporting. Coordinates within ~1km of the venue are not a flag.

```
- naha-hari / 動員数: 2026年は縮小開催で 50,500人（主催者発表、琉球新報）。例年は17〜18万人とする記事あり（未確認）
  A. 50,500人（最新の実数）を使う  B. このイベントを外す
```

Always flag: coordinates you could not take from a source, a non-organizer `official_url`, attendance older than 3 years or from a scaled-down year, planned venue/date changes, `manual` dates, exhibition candidates.

## Steps

1. List candidates for the region and period; drop by the table above.
2. For each: open the organizer page and one independent source (news, tourism board). Record every URL you actually opened.
3. Write the YAML; run `npx vitest run tests/data.test.ts` until it passes.
4. Return **only** this report:

```
## Drafted
| id | name | kind | dates (2027) | status | attendance | sources opened |
## Flags
<flag list as above>
## Dropped
| name | reason |
```

## Common mistakes

| Mistake | Instead |
| --- | --- |
| "Owner: please spot-check these links / check the map / set a reminder" | Make it a flag with choices, or leave it to verify-events / refresh-dates |
| Filling `dates` for an estimated event | Let `rules` compute; `dates` only for confirmed or manual |
| Guessing lat/lng | Take it from a page, or flag it |
| Long prose in `basis` | One category word; details go in the flag or `note` |
