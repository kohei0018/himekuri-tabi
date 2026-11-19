import { resolveRule, bloomRange, resolveDates, ruleText } from '../src/lib/dates';
import { HOLIDAYS_2027, findHoliday } from '../src/lib/holidays';
import type { EventFile } from '../src/lib/types';

const one = (d: string) => [{ start: d, end: d }];

test('fixed', () => expect(resolveRule({ type: 'fixed', month: 5, day: 15 }, 2027)).toEqual(one('2027-05-15')));
test('fixed with length', () =>
  expect(resolveRule({ type: 'fixed', month: 7, day: 24, length: 2 }, 2027)).toEqual([{ start: '2027-07-24', end: '2027-07-25' }]));
test('last Saturday of July', () =>
  expect(resolveRule({ type: 'nth_weekday', month: 7, weekday: 6, n: -1 }, 2027)).toEqual(one('2027-07-31')));
test('third Monday of July', () =>
  expect(resolveRule({ type: 'nth_weekday', month: 7, weekday: 1, n: 3 }, 2027)).toEqual(one('2027-07-19')));
test('day before 海の日, 2 days', () =>
  expect(resolveRule({ type: 'holiday_relative', holiday: '海の日', offset: -1, length: 2 }, 2027)).toEqual([
    { start: '2027-07-18', end: '2027-07-19' },
  ]));
test('manual resolves to nothing', () => expect(resolveRule({ type: 'manual' }, 2027)).toEqual([]));

test('bloom range runs to 7 days after full bloom', () =>
  expect(bloomRange({ station: '京都', flowering: '03-26', full_bloom: '04-04', forecast_url: 'https://tenki.jp/' }, 2027)).toEqual({
    start: '2027-03-26',
    end: '2027-04-11',
  }));

test('holidays', () => {
  expect(Object.keys(HOLIDAYS_2027)).toHaveLength(17);
  expect(findHoliday('春分の日', 2027)).toBe('2027-03-21');
  expect(HOLIDAYS_2027['2027-03-22']).toBe('休日');
  expect(findHoliday('春分の日', 2028)).toBeUndefined();
});

const base = {
  id: 'x', name: 'x', kind: 'event' as const, genre: ['祭り'], country: 'JP', region: 'domestic' as const, prefecture: '京都府', city: '京都市',
  lat: 35, lng: 135, nearest: { city: '京都市' }, summary: 's', official_url: 'https://x.org',
  attendance: { value: 30000, basis: '主催者発表', source_url: 'https://x.org' },
};

test('resolveDates prefers occurrence dates', () => {
  const e = { ...base, rules: [{ type: 'fixed', month: 5, day: 15 }],
    occurrences: [{ year: 2027, status: 'confirmed', dates: one('2027-05-16'), source_url: 'https://x.org' }] } as EventFile;
  expect(resolveDates(e, 2027)).toEqual({ dates: one('2027-05-16'), status: 'confirmed' });
});
test('resolveDates merges multiple rules as estimated', () => {
  const e = { ...base, rules: [{ type: 'fixed', month: 7, day: 28 }, { type: 'fixed', month: 7, day: 10 }],
    occurrences: [{ year: 2027, status: 'estimated' }] } as EventFile;
  expect(resolveDates(e, 2027)).toEqual({ dates: [...one('2027-07-10'), ...one('2027-07-28')], status: 'estimated' });
});
test('resolveDates for bloom is normal', () => {
  const e = { ...base, kind: 'bloom', attendance: undefined,
    bloom: { station: '京都', flowering: '03-26', full_bloom: '04-04', forecast_url: 'https://tenki.jp/' },
    occurrences: [{ year: 2027, status: 'normal' }] } as unknown as EventFile;
  expect(resolveDates(e, 2027)).toEqual({ dates: [{ start: '2027-03-26', end: '2027-04-11' }], status: 'normal' });
});
test('resolveDates is null without an occurrence for the year', () => {
  const e = { ...base, rules: [{ type: 'manual' }], occurrences: [{ year: 2026, status: 'estimated', dates: one('2026-04-01') }] } as EventFile;
  expect(resolveDates(e, 2027)).toBeNull();
});

test('ruleText', () => {
  expect(ruleText([{ type: 'fixed', month: 5, day: 15 }])).toBe('毎年5月15日');
  expect(ruleText([{ type: 'nth_weekday', month: 7, weekday: 6, n: -1 }])).toBe('7月の最終土曜');
  expect(ruleText([{ type: 'nth_weekday', month: 7, weekday: 1, n: 3 }])).toBe('7月の第3月曜');
  expect(ruleText([{ type: 'holiday_relative', holiday: '海の日', offset: -1, length: 2 }])).toBe('海の日の前日から2日間');
  expect(ruleText([{ type: 'fixed', month: 7, day: 24, length: 2 }])).toBe('毎年7月24日から2日間');
  expect(ruleText([{ type: 'fixed', month: 7, day: 10 }, { type: 'fixed', month: 7, day: 28 }])).toBe('毎年7月10日・毎年7月28日');
});
