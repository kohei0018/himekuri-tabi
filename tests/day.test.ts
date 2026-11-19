import { addDays, diffDays, weekday, overlaps, eachDay, monthRange } from '../src/lib/day';

test('weekday uses UTC (2027-07-31 is Saturday)', () => expect(weekday('2027-07-31')).toBe(6));
test('addDays crosses month end', () => {
  expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
  expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
});
test('diffDays', () => expect(diffDays('2027-04-01', '2027-04-05')).toBe(4));
test('overlaps includes both ends', () => {
  expect(overlaps({ start: '2027-04-01', end: '2027-04-03' }, { start: '2027-04-03', end: '2027-04-05' })).toBe(true);
  expect(overlaps({ start: '2027-04-01', end: '2027-04-02' }, { start: '2027-04-03', end: '2027-04-05' })).toBe(false);
});
test('eachDay', () => expect(eachDay({ start: '2027-04-30', end: '2027-05-02' })).toEqual(['2027-04-30', '2027-05-01', '2027-05-02']));
test('monthRange', () => {
  expect(monthRange('2027-02')).toEqual({ start: '2027-02-01', end: '2027-02-28' });
  expect(monthRange('2027-05')).toEqual({ start: '2027-05-01', end: '2027-05-31' });
});
