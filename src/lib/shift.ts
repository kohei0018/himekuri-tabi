import type { DateRange, ResolvedEvent } from './types';
import type { Hit } from './search';
import { addDays, overlaps } from './day';
import { eventScore } from './score';
import { SHIFT_MAX_DAYS, SHIFT_MAX_SUGGESTIONS } from '../config';

export type Shift = { offset: number; range: DateRange; added: Hit[] };

// events はエリアと規模で絞ったもの。期間の長さは変えずに前後へずらす（設計書 4.6）
export function suggestShifts(period: DateRange, events: ResolvedEvent[]): Shift[] {
  const inNow = (e: ResolvedEvent) => e.dates.some((r) => overlaps(r, period));
  const shifts: (Shift & { score: number })[] = [];
  for (let k = 1; k <= SHIFT_MAX_DAYS; k++) {
    for (const offset of [-k, k]) {
      const range = { start: addDays(period.start, offset), end: addDays(period.end, offset) };
      const added = events
        .filter((e) => !inNow(e))
        .map((e) => ({ event: e, days: e.dates.filter((r) => overlaps(r, range)) }))
        .filter((h) => h.days.length > 0);
      if (added.length) shifts.push({ offset, range, added, score: added.reduce((s, h) => s + eventScore(h.event), 0) });
    }
  }
  // 生成順が |offset| の小さい順・前が先なので、安定ソートで同点の順が決まる
  shifts.sort((a, b) => b.score - a.score);
  return shifts.slice(0, SHIFT_MAX_SUGGESTIONS).map(({ score: _score, ...s }) => s);
}

const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

export function shiftLabel(s: Shift): string {
  const dir = s.offset < 0 ? '前' : '後';
  return `${Math.abs(s.offset)}日${dir}にずらすと（${md(s.range.start)}〜${md(s.range.end)}）`;
}
