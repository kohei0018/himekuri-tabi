import type { EventFile, ResolvedEvent } from './types';
import { resolveDates, ruleText } from './dates';

// YAML の形 → 画面と検索で使う形。対象年の日程がないものは除く
export function toResolved(files: EventFile[], year: number): ResolvedEvent[] {
  const out: ResolvedEvent[] = [];
  for (const f of files) {
    const resolved = resolveDates(f, year);
    if (!resolved) continue;
    const { rules, occurrences, bloom, ...rest } = f;
    const occ = occurrences.find((o) => o.year === year);
    const text = rules ? ruleText(rules) : '';
    out.push({
      ...rest,
      ...resolved,
      ...(text ? { ruleText: text } : {}),
      ...(occ?.source_url ? { sourceUrl: occ.source_url } : {}),
      ...(bloom ? { forecastUrl: bloom.forecast_url } : {}),
    });
  }
  return out.sort((a, b) => a.dates[0].start.localeCompare(b.dates[0].start));
}
