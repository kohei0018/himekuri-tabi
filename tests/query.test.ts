import { parseQuery, toSearchParams } from '../src/lib/query';

const ids = ['kyoto', 'osaka'];
const q = (s: string) => parseQuery(new URLSearchParams(s), ids);

test('month and where', () =>
  expect(q('when=2027-04&where=kyoto')).toEqual({ when: { kind: 'month', month: '2027-04' }, where: 'kyoto', size: 10000 }));

test('range', () =>
  expect(q('when=2027-04-01..2027-04-05').when).toEqual({ kind: 'range', range: { start: '2027-04-01', end: '2027-04-05' } }));

test('invalid values drop only that field', () => {
  expect(q('when=2027-13').when).toBeUndefined();
  expect(q('when=2027-04-05..2027-04-01').when).toBeUndefined();
  expect(q('when=2027-02-30..2027-03-01').when).toBeUndefined();
  expect(q('when=2027-04&where=nowhere')).toEqual({ when: { kind: 'month', month: '2027-04' }, size: 10000 });
  expect(q('size=5').size).toBe(10000);
  expect(q('size=100000').size).toBe(100000);
});

test('round trip', () => {
  for (const s of ['when=2027-04&where=kyoto', 'when=2027-04-01..2027-04-05&where=osaka&size=100000', 'where=kyoto', '']) {
    expect(toSearchParams(q(s)).toString()).toBe(new URLSearchParams(s).toString());
  }
});
