import type { DateRange } from './types';
import { addDays } from './day';
import { SIZE_DEFAULT, SIZE_STEPS } from '../config';

export type When = { kind: 'month'; month: string } | { kind: 'range'; range: DateRange };
export type Query = { when?: When; where?: string; size: number };

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
// 実在する日付か（2027-02-30 などを弾く）
const isDate = (s: string) => DATE.test(s) && addDays(s, 0) === s;

function parseWhen(v: string | null): When | undefined {
  if (!v) return undefined;
  if (MONTH.test(v)) return { kind: 'month', month: v };
  const [start, end, ...rest] = v.split('..');
  if (rest.length === 0 && start && end && isDate(start) && isDate(end) && start <= end) {
    return { kind: 'range', range: { start, end } };
  }
  return undefined;
}

export function parseQuery(p: URLSearchParams, areaIds: string[]): Query {
  const q: Query = { size: SIZE_DEFAULT };
  const when = parseWhen(p.get('when'));
  if (when) q.when = when;
  const where = p.get('where');
  if (where && areaIds.includes(where)) q.where = where;
  const size = Number(p.get('size'));
  if ((SIZE_STEPS as readonly number[]).includes(size)) q.size = size;
  return q;
}

export function toSearchParams(q: Query): URLSearchParams {
  const p = new URLSearchParams();
  if (q.when) p.set('when', q.when.kind === 'month' ? q.when.month : `${q.when.range.start}..${q.when.range.end}`);
  if (q.where) p.set('where', q.where);
  if (q.size !== SIZE_DEFAULT) p.set('size', String(q.size));
  return p;
}
