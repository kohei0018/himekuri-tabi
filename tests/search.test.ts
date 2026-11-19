import { search, eventsNear } from '../src/lib/search';
import { areas, ev, d } from './fixtures';

const kyoto = areas[0];
const aoi = ev({ name: '葵祭', dates: [d('2027-05-15')] });
const big = ev({ name: '大きな祭り', dates: [d('2027-04-10')], attendance: { value: 500000, basis: 'x', source_url: 'https://x.org' } });
const tenjin = ev({ name: '天神祭', prefecture: '大阪府', city: '大阪市', lat: 34.6957, lng: 135.5126, dates: [d('2027-04-24', '2027-04-25')] });
const sapporo = ev({ name: '札幌のイベント', prefecture: '北海道', city: '札幌市', lat: 43.06, lng: 141.35, dates: [d('2027-04-10')] });
const sakura = ev({ name: '京都の桜', kind: 'bloom', attendance: undefined, status: 'normal', dates: [d('2027-03-26', '2027-04-11')] });
const march = ev({ name: '3月末', dates: [d('2027-03-30')] });
const split = ev({ name: '飛び飛び', dates: [d('2027-07-10'), d('2027-07-28')] });
const all = [aoi, big, tenjin, sapporo, sakura, march, split];
const today = '2027-03-01';
const names = (hits: { event: { name: string } }[]) => hits.map((h) => h.event.name);
const range = (start: string, end: string) => ({ kind: 'range' as const, range: d(start, end) });
const month = (m: string) => ({ kind: 'month' as const, month: m });

test('nothing → upcoming from today in date order', () => {
  const r = search({ size: 10000 }, all, areas, '2027-04-12');
  if (r.mode !== 'upcoming') throw new Error(r.mode);
  expect(names(r.hits)).toEqual(['天神祭', '葵祭', '飛び飛び']);
});

test('when only → candidates ranked by score sum', () => {
  const r = search({ when: month('2027-04'), size: 10000 }, all, areas, today);
  if (r.mode !== 'candidates') throw new Error(r.mode);
  expect(r.areas[0].area.id).toBe('kyoto');
  expect(r.areas.at(-1)!.area.id).toBe('sapporo');
  expect(names(r.areas[0].hits)[0]).toBe('大きな祭り');
});

test('where only → calendar by month with data', () => {
  const r = search({ where: 'kyoto', size: 10000 }, all, areas, today);
  if (r.mode !== 'calendar') throw new Error(r.mode);
  expect(r.months.map((m) => m.month)).toEqual(['2027-03', '2027-04', '2027-05', '2027-07']);
});

test('both with month → calendar of that month only', () => {
  const r = search({ when: month('2027-05'), where: 'kyoto', size: 10000 }, all, areas, today);
  if (r.mode !== 'calendar') throw new Error(r.mode);
  expect(r.months.map((m) => m.month)).toEqual(['2027-05']);
});

test('both with range → overlap', () => {
  const r = search({ when: range('2027-05-13', '2027-05-16'), where: 'kyoto', size: 10000 }, all, areas, today);
  if (r.mode !== 'overlap') throw new Error(r.mode);
  expect(names(r.hits)).toEqual(['葵祭']);
});

test('size filter drops small events but keeps bloom', () => {
  const r = search({ when: month('2027-04'), where: 'kyoto', size: 100000 }, all, areas, today);
  if (r.mode !== 'calendar') throw new Error(r.mode);
  expect(names(r.months[0].hits).sort()).toEqual(['京都の桜', '大きな祭り'].sort());
});

test('within 50km includes Osaka, excludes Sapporo', () => {
  const near = eventsNear(kyoto, all).map((e) => e.name);
  expect(near).toContain('天神祭');
  expect(near).not.toContain('札幌のイベント');
});

test('month with no data → empty candidates', () => {
  const r = search({ when: month('2027-08'), size: 10000 }, all, areas, today);
  if (r.mode !== 'candidates') throw new Error(r.mode);
  expect(r.areas).toEqual([]);
});

test('range across month boundary', () => {
  const r = search({ when: range('2027-03-30', '2027-04-02'), where: 'kyoto', size: 10000 }, all, areas, today);
  if (r.mode !== 'overlap') throw new Error(r.mode);
  expect(names(r.hits).sort()).toEqual(['3月末', '京都の桜'].sort());
});

test('split dates: only overlapping ranges in days', () => {
  const r = search({ when: range('2027-07-25', '2027-07-30'), where: 'kyoto', size: 10000 }, all, areas, today);
  if (r.mode !== 'overlap') throw new Error(r.mode);
  expect(r.hits[0].days).toEqual([d('2027-07-28')]);
});

test('overlap lists each event once even with overlapping areas', () => {
  const r = search({ when: range('2027-04-01', '2027-04-30'), where: 'arashiyama', size: 10000 }, all, areas, today);
  if (r.mode !== 'overlap') throw new Error(r.mode);
  const ids = r.hits.map((h) => h.event.id);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
});

test('event ending on the start day counts', () => {
  const r = search({ when: range('2027-04-11', '2027-04-13'), where: 'kyoto', size: 10000 }, all, areas, today);
  if (r.mode !== 'overlap') throw new Error(r.mode);
  expect(names(r.hits)).toContain('京都の桜');
});

test('monthsWithData walks every month inside a long range', async () => {
  const { monthsWithData } = await import('../src/lib/search');
  expect(monthsWithData([ev({ dates: [d('2027-03-15', '2027-05-20')] })])).toEqual(['2027-03', '2027-04', '2027-05']);
});
