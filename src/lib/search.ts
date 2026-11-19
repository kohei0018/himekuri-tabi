import type { Area, DateRange, DateStr, ResolvedEvent } from './types';
import type { Query } from './query';
import { monthRange, overlaps } from './day';
import { distanceKm } from './geo';
import { eventScore, passesSize } from './score';
import { RADIUS_KM } from '../config';

export type Hit = { event: ResolvedEvent; days: DateRange[] };
export type SearchResult =
  | { mode: 'upcoming'; hits: Hit[] }
  | { mode: 'candidates'; period: DateRange; areas: { area: Area; score: number; hits: Hit[] }[] }
  | { mode: 'calendar'; area: Area; months: { month: string; hits: Hit[] }[] }
  | { mode: 'overlap'; area: Area; period: DateRange; hits: Hit[] };

export function eventsNear(area: Area, events: ResolvedEvent[]): ResolvedEvent[] {
  return events.filter((e) => distanceKm(area, e) <= RADIUS_KM);
}

// 期間に重なった範囲だけを持つ Hit。重ならなければ null
function hitIn(e: ResolvedEvent, period: DateRange): Hit | null {
  const days = e.dates.filter((r) => overlaps(r, period));
  return days.length ? { event: e, days } : null;
}

const byStart = (a: Hit, b: Hit) => a.days[0].start.localeCompare(b.days[0].start);
const byScore = (a: Hit, b: Hit) => eventScore(b.event) - eventScore(a.event) || byStart(a, b);

function hitsIn(events: ResolvedEvent[], period: DateRange): Hit[] {
  return events.map((e) => hitIn(e, period)).filter((h): h is Hit => h !== null);
}

function monthsOf(events: ResolvedEvent[]): string[] {
  const set = new Set<string>();
  for (const e of events) {
    for (const r of e.dates) {
      for (let m = r.start.slice(0, 7); m <= r.end.slice(0, 7); m = nextMonth(m)) set.add(m);
    }
  }
  return [...set].sort();
}

function nextMonth(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`;
}

export function search(q: Query, events: ResolvedEvent[], areas: Area[], today: DateStr): SearchResult {
  const sized = events.filter((e) => passesSize(e, q.size));
  const area = q.where ? areas.find((a) => a.id === q.where) : undefined;
  const period = q.when ? (q.when.kind === 'month' ? monthRange(q.when.month) : q.when.range) : undefined;

  if (!period && !area) {
    return { mode: 'upcoming', hits: hitsIn(sized, { start: today, end: '9999-12-31' }).sort(byStart) };
  }

  if (period && !area) {
    const ranked = areas
      .map((a) => {
        const hits = hitsIn(eventsNear(a, sized), period).sort(byScore);
        return { area: a, score: hits.reduce((s, h) => s + eventScore(h.event), 0), hits };
      })
      .filter((x) => x.hits.length > 0);
    // 安定ソート：同点は件数、さらに同じならエリアの一覧の順
    ranked.sort((a, b) => b.score - a.score || b.hits.length - a.hits.length);
    return { mode: 'candidates', period, areas: ranked };
  }

  const near = eventsNear(area!, sized);
  if (q.when?.kind === 'range') {
    return { mode: 'overlap', area: area!, period: q.when.range, hits: hitsIn(near, q.when.range).sort(byStart) };
  }
  const months = q.when?.kind === 'month' ? [q.when.month] : monthsOf(near);
  return {
    mode: 'calendar',
    area: area!,
    months: months.map((m) => ({ month: m, hits: hitsIn(near, monthRange(m)).sort(byStart) })),
  };
}
