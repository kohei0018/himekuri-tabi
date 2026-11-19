---
name: refresh-dates
description: Use when it is time for the monthly himekuri-tabi date check, or when someone asks whether estimated (推定) event dates have been announced yet
---

# refresh-dates

Monthly: find which `status: estimated` events have announced this year's dates, switch them to `confirmed`, and open one PR. The owner only merges.

## Steps

1. List targets: every `data/events/*.yaml` whose occurrence for the target year (`TARGET_YEAR` in `src/config.ts`) has `status: estimated`.
2. For each, open `official_url` and search news for this year's announcement.
   - **Announced** → set `status: confirmed`, `dates: [{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }]` (quoted), `source_url: <announcement page>`. Keep `rules`.
   - **Not yet** → leave the file unchanged.
   - **Changed** (cancelled, new venue, different dates than the rule) → apply what the announcement says and add it to the flags.
3. `npx vitest run tests/data.test.ts`.
4. Run **verify-events** in a fresh subagent on the changed files only.
5. Branch `data/refresh-YYYY-MM`, commit, open a PR whose body is:

```
## 確定に変えたもの
| id | 日程 | 出典 |
## まだ推定のもの
| id | 例年のルール | 確認したページ |
## 選んでください
<verify-events の「選んでください」をそのまま>
```

If nothing was announced, skip the PR and report the まだ推定 table only.
