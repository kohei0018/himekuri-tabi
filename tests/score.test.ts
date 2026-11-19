import { eventScore, passesSize } from '../src/lib/score';
import type { ResolvedEvent } from '../src/lib/types';

const ev = (kind: ResolvedEvent['kind'], value?: number) =>
  ({ kind, attendance: value ? { value, basis: 'x', source_url: 'https://x.org' } : undefined }) as ResolvedEvent;

test('score by attendance tier', () => {
  expect(eventScore(ev('event', 30000))).toBe(1);
  expect(eventScore(ev('event', 500000))).toBe(2);
  expect(eventScore(ev('event', 1200000))).toBe(3);
  expect(eventScore(ev('event', 5000))).toBe(0);
});
test('bloom and exhibition score 1', () => {
  expect(eventScore(ev('bloom'))).toBe(1);
  expect(eventScore(ev('exhibition'))).toBe(1);
});
test('passesSize', () => {
  expect(passesSize(ev('event', 30000), 100000)).toBe(false);
  expect(passesSize(ev('event', 30000), 10000)).toBe(true);
  expect(passesSize(ev('bloom'), 1000000)).toBe(true);
});
