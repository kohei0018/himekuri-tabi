import { crowdedDays } from '../src/lib/crowd';
import { ev, d } from './fixtures';

const withAttendance = (value: number) =>
  ev({ dates: [d('2027-07-24', '2027-07-25')], attendance: { value, basis: 'x', source_url: 'https://x.org' } });

test('days within the period that have a 1M+ event', () =>
  expect(crowdedDays(d('2027-07-23', '2027-07-24'), [withAttendance(1200000)])).toEqual(['2027-07-24']));

test('500k does not count', () => expect(crowdedDays(d('2027-07-23', '2027-07-24'), [withAttendance(500000)])).toEqual([]));

test('sorted and unique across events', () =>
  expect(crowdedDays(d('2027-07-24', '2027-07-25'), [withAttendance(1200000), withAttendance(2000000)])).toEqual([
    '2027-07-24',
    '2027-07-25',
  ]));
