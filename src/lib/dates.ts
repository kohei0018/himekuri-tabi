import type { BloomInfo, DateRange, EventFile, Rule, Status } from './types';
import { addDays, monthRange, weekday, ymd } from './day';
import { findHoliday } from './holidays';

const span = (start: string, length = 1): DateRange => ({ start, end: addDays(start, length - 1) });

export function resolveRule(rule: Rule, year: number): DateRange[] {
  switch (rule.type) {
    case 'fixed':
      return [span(ymd(year, rule.month, rule.day), rule.length)];
    case 'nth_weekday': {
      const m = monthRange(`${year}-${String(rule.month).padStart(2, '0')}`);
      let d: string;
      if (rule.n === -1) {
        d = m.end;
        while (weekday(d) !== rule.weekday) d = addDays(d, -1);
      } else {
        d = m.start;
        while (weekday(d) !== rule.weekday) d = addDays(d, 1);
        d = addDays(d, 7 * (rule.n - 1));
        if (d > m.end) return [];
      }
      return [span(d, rule.length)];
    }
    case 'holiday_relative': {
      const h = findHoliday(rule.holiday, year);
      return h ? [span(addDays(h, rule.offset), rule.length)] : [];
    }
    case 'manual':
      return [];
  }
}

export function bloomRange(b: BloomInfo, year: number): DateRange {
  return { start: `${year}-${b.flowering}`, end: addDays(`${year}-${b.full_bloom}`, 7) };
}

export function resolveDates(e: EventFile, year: number): { dates: DateRange[]; status: Status } | null {
  const occ = e.occurrences.find((o) => o.year === year);
  if (!occ) return null;
  if (occ.dates) return { dates: occ.dates, status: occ.status };
  if (e.kind === 'bloom' && e.bloom) return { dates: [bloomRange(e.bloom, year)], status: 'normal' };
  const dates = (e.rules ?? []).flatMap((r) => resolveRule(r, year)).sort((a, b) => a.start.localeCompare(b.start));
  return dates.length ? { dates, status: 'estimated' } : null;
}

const WD = ['日', '月', '火', '水', '木', '金', '土'];
const days = (length?: number) => (length && length > 1 ? `から${length}日間` : '');

function one(r: Rule): string {
  switch (r.type) {
    case 'fixed':
      return `毎年${r.month}月${r.day}日${days(r.length)}`;
    case 'nth_weekday':
      return `${r.month}月の${r.n === -1 ? '最終' : `第${r.n}`}${WD[r.weekday]}曜${days(r.length)}`;
    case 'holiday_relative': {
      const o = r.offset;
      const rel = o === 0 ? '' : o === -1 ? 'の前日' : o === 1 ? 'の翌日' : o < 0 ? `の${-o}日前` : `の${o}日後`;
      return `${r.holiday}${rel}${days(r.length)}`;
    }
    case 'manual':
      return '';
  }
}

export function ruleText(rules: Rule[]): string {
  return rules.map(one).filter(Boolean).join('・');
}
