---
name: verify-events
description: Use when himekuri-tabi event YAML drafts (from draft-events or refresh-dates) need checking against their sources before a data PR — run in a fresh subagent that did not write the drafts
---

# verify-events

Check each draft in `data/events/` **only against the pages it cites** (plus the organizer's official page). You did not write these drafts; do not trust their reasoning, only their URLs. The result is pasted into the PR body so the owner can merge by picking choices — the owner never opens sources.

## For each file, check

| Field | Pass when |
| --- | --- |
| dates / rules | `confirmed`: the `source_url` page states this year's dates exactly. `estimated`: the cited pages show the rule (e.g. "毎年5月15日") or past years consistent with it |
| place, lat/lng | the cited/official page names the place; coordinates are within ~1km of it |
| attendance | the `attendance.source_url` page states the number and the `basis` matches who said it |
| kind / scope | fits spec §5.1 (1万人以上, not permanent, not a performer/match event) |
| schema | `npx vitest run tests/data.test.ts` passes; full dates are quoted strings |

A page that does not load, is paywalled at the relevant part, or does not state the value = **not verified**.

## Output (paste-ready for the PR body)

```
## 照合済み（見なくてよい）
- kyoto-aoi-matsuri: 日程・場所・動員数
- naha-hari: 日程・場所

## 選んでください
- [ ] naha-hari / 動員数：出典の琉球新報は 50,500人（2026年、縮小開催）。草案と一致
      A. 50,500人を使う（おすすめ）  B. このイベントを外す
- [ ] naha-hari / 会場：2027年から那覇ふ頭へ移る方針（琉球新報 2026-04-29、「検討」とも）。座標は新会場の推定
      A. 新会場の座標で載せ、note に「会場は変更予定」と書く（おすすめ）  B. 2027年の会場発表まで載せない
```

Rules for the output:
- Every item under 選んでください has 2–3 lettered choices, the first is your recommendation, and each choice is something that can be applied without further research.
- If you corrected a value yourself (the source clearly says otherwise), list it under 照合済み as `修正: <field> <old> → <new>（出典）` and edit the file.
- Nothing else: no review instructions, no "please check", no reminders.
