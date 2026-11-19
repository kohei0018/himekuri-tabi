// 'YYYY-MM-DD' の文字列を UTC だけで扱う（ローカル時刻の Date は使わない）
import type { DateRange, DateStr } from './types';

const MS_DAY = 86400000;
const toMs = (d: DateStr) => {
  const [y, m, day] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, day);
};
const fromMs = (ms: number): DateStr => new Date(ms).toISOString().slice(0, 10);

export const ymd = (y: number, m: number, d: number): DateStr => fromMs(Date.UTC(y, m - 1, d));
export const addDays = (d: DateStr, n: number): DateStr => fromMs(toMs(d) + n * MS_DAY);
export const diffDays = (a: DateStr, b: DateStr): number => Math.round((toMs(b) - toMs(a)) / MS_DAY);
export const weekday = (d: DateStr): number => new Date(toMs(d)).getUTCDay();
export const overlaps = (a: DateRange, b: DateRange): boolean => a.start <= b.end && b.start <= a.end;

export function eachDay(r: DateRange): DateStr[] {
  const out: DateStr[] = [];
  for (let d = r.start; d <= r.end; d = addDays(d, 1)) out.push(d);
  return out;
}

export function monthRange(ym: string): DateRange {
  const [y, m] = ym.split('-').map(Number);
  return { start: ymd(y, m, 1), end: ymd(y, m + 1, 0) };
}
