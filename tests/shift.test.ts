import { suggestShifts, shiftLabel } from '../src/lib/shift';
import { ev, d } from './fixtures';

const big = (start: string, end = start, value = 500000) =>
  ev({ dates: [d(start, end)], attendance: { value, basis: 'x', source_url: 'https://x.org' } });

test('3 days earlier picks up an event on 7/17', () => {
  const e = big('2027-07-17');
  const s = suggestShifts(d('2027-07-20', '2027-07-22'), [e]);
  expect(s).toHaveLength(1);
  expect(s[0].offset).toBe(-3);
  expect(s[0].range).toEqual(d('2027-07-17', '2027-07-19'));
  expect(s[0].added.map((h) => h.event.id)).toEqual([e.id]);
});

test('nothing new → no suggestions', () => {
  expect(suggestShifts(d('2027-07-20', '2027-07-22'), [big('2027-07-21')])).toEqual([]);
  expect(suggestShifts(d('2027-07-20', '2027-07-22'), [])).toEqual([]);
});

test('at most 2, ties by smaller |offset|, then earlier', () => {
  const evs = [big('2027-07-17'), big('2027-07-18'), big('2027-07-24'), big('2027-07-25')];
  const s = suggestShifts(d('2027-07-20', '2027-07-22'), evs);
  expect(s).toHaveLength(2);
  // -2 → adds 7/18 (2pts); +2 → adds 7/24 (2pts); -3 → 7/17,7/18 (4pts); +3 → 7/24,7/25 (4pts)
  expect(s.map((x) => x.offset)).toEqual([-3, 3]);
});

test('boundary: shifted end equals event start', () => {
  const s = suggestShifts(d('2027-07-20', '2027-07-22'), [big('2027-07-23', '2027-07-30')]);
  expect(s[0].offset).toBe(1);
});

test('shiftLabel', () => {
  expect(shiftLabel({ offset: -3, range: d('2027-04-01', '2027-04-05'), added: [] })).toBe('3日前にずらすと（4/1〜4/5）');
  expect(shiftLabel({ offset: 2, range: d('2027-04-06', '2027-04-10'), added: [] })).toBe('2日後にずらすと（4/6〜4/10）');
});
