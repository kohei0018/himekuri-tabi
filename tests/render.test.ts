import { renderResult, renderDay } from '../src/client/render';
import type { SearchResult } from '../src/lib/search';
import type { Query } from '../src/lib/query';
import { areas, ev, d } from './fixtures';

const kyoto = areas[0];
const big = (name: string, day: string, value = 500000) =>
  ev({ name, dates: [d(day)], attendance: { value, basis: 'x', source_url: 'https://x.org' } });
const q: Query = { when: { kind: 'range', range: d('2027-07-20', '2027-07-22') }, where: 'kyoto', size: 10000 };
const none = { shifts: [], crowded: [], query: q };

test('overlap with a shift shows the label and a link that keeps where', () => {
  const e = big('宵山', '2027-07-17');
  const r: SearchResult = { mode: 'overlap', area: kyoto, period: q.when!.kind === 'range' ? q.when!.range : d('x'), hits: [] };
  const html = renderResult(r, { ...none, shifts: [{ offset: -3, range: d('2027-07-17', '2027-07-19'), added: [{ event: e, days: e.dates }] }] });
  expect(html).toContain('3日前にずらすと（7/17〜7/19）');
  expect(html).toContain('宵山');
  expect(html).toContain('href="?when=2027-07-17..2027-07-19&amp;where=kyoto"');
  expect(html).toContain('この日程で探す');
});

test('crowded day marks the card', () => {
  const e = big('天神祭', '2027-07-21', 1300000);
  const r: SearchResult = { mode: 'overlap', area: kyoto, period: d('2027-07-20', '2027-07-22'), hits: [{ event: e, days: e.dates }] };
  const html = renderResult(r, { ...none, crowded: ['2027-07-21'] });
  expect(html).toContain('宿が埋まりやすい日');
  expect(html).toContain('is-crowded');
});

test('empty candidates message', () => {
  const r: SearchResult = { mode: 'candidates', period: d('2027-08-01', '2027-08-31'), areas: [] };
  expect(renderResult(r, none)).toContain('この時期のイベントはまだありません');
});

test('names are escaped', () => {
  const e = big('<script>alert(1)</script>', '2027-07-21');
  const r: SearchResult = { mode: 'overlap', area: kyoto, period: d('2027-07-20', '2027-07-22'), hits: [{ event: e, days: e.dates }] };
  const html = renderResult(r, none);
  expect(html).not.toContain('<script>');
  expect(html).toContain('&lt;script&gt;');
});

test('estimated card gets the dashed badge', () => {
  const e = big('祭り', '2027-07-21');
  const r: SearchResult = { mode: 'overlap', area: kyoto, period: d('2027-07-20', '2027-07-22'), hits: [{ event: e, days: e.dates }] };
  expect(renderResult(r, none)).toContain('badge badge-estimated');
});

test('calendar grid: Sunday start, top 2 by score and +N件', () => {
  const hits = [big('小', '2027-05-15', 20000), big('中', '2027-05-15', 200000), big('大', '2027-05-15', 2000000)].map((e) => ({ event: e, days: e.dates }));
  const r: SearchResult = { mode: 'calendar', area: kyoto, months: [{ month: '2027-05', hits }] };
  const html = renderResult(r, none);
  expect(html).toContain('2027年5月');
  // 2027-05-01 is a Saturday → 6 blank cells before it
  expect(html.match(/class="cal-blank"/g)).toHaveLength(6);
  const cell = html.slice(html.indexOf('data-day="2027-05-15"'));
  expect(cell.indexOf('大')).toBeLessThan(cell.indexOf('+1件'));
  expect(cell.slice(0, cell.indexOf('+1件'))).toContain('中');
  expect(cell.slice(0, cell.indexOf('+1件'))).not.toContain('>小<');
});

test('renderDay lists every event on that day', () => {
  const hits = [big('小', '2027-05-15', 20000), big('大', '2027-05-15', 2000000)].map((e) => ({ event: e, days: e.dates }));
  const html = renderDay('2027-05-15', hits);
  expect(html).toContain('5月15日（土）');
  expect(html).toContain('小');
  expect(html).toContain('大');
});

test('candidates list each area with count and top events', () => {
  const e = big('葵祭', '2027-05-15');
  const r: SearchResult = { mode: 'candidates', period: d('2027-05-01', '2027-05-31'), areas: [{ area: kyoto, score: 2, hits: [{ event: e, days: e.dates }] }] };
  const html = renderResult(r, { ...none, query: { when: { kind: 'month', month: '2027-05' }, size: 10000 } });
  expect(html).toContain('京都市');
  expect(html).toContain('1件');
  expect(html).toContain('href="?when=2027-05&amp;where=kyoto"');
});

test('calendar marks national holidays', () => {
  const e = big('桜', '2027-03-26');
  const r: SearchResult = { mode: 'calendar', area: kyoto, months: [{ month: '2027-03', hits: [{ event: e, days: e.dates }] }] };
  const html = renderResult(r, none);
  const cell = html.slice(html.indexOf('data-day="2027-03-21"') - 60, html.indexOf('data-day="2027-03-22"'));
  expect(cell).toContain('is-holiday');
  expect(cell).toContain('春分の日');
});

test('calendar with no events in any month shows the empty message', () => {
  const r: SearchResult = { mode: 'calendar', area: kyoto, months: [{ month: '2027-08', hits: [] }] };
  expect(renderResult(r, none)).toContain('この時期のイベントはまだありません');
});
