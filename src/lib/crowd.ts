import type { DateRange, DateStr, ResolvedEvent } from './types';
import { eachDay, overlaps } from './day';
import { CROWD_THRESHOLD } from '../config';

// 動員 CROWD_THRESHOLD 以上のイベントが開かれている、期間内の日（設計書 4.7）
export function crowdedDays(period: DateRange, events: ResolvedEvent[]): DateStr[] {
  const days = new Set<DateStr>();
  for (const e of events) {
    if ((e.attendance?.value ?? 0) < CROWD_THRESHOLD) continue;
    for (const r of e.dates) {
      if (!overlaps(r, period)) continue;
      for (const d of eachDay(r)) if (d >= period.start && d <= period.end) days.add(d);
    }
  }
  return [...days].sort();
}
