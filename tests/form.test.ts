import { formQuery } from '../src/client/form';

const ids = ['kyoto'];
const base = { when: '', from: '', to: '', where: '', size: '10000' };

test('choosing 日にちを指定する without dates yet is pending, not a reset', () => {
  expect(formQuery({ ...base, when: 'range' }, ids)).toBeNull();
  expect(formQuery({ ...base, when: 'range', from: '2027-05-13' }, ids)).toBeNull();
  expect(formQuery({ ...base, when: 'range', from: '2027-05-16', to: '2027-05-13' }, ids)).toBeNull();
});

test('a complete range becomes a range query', () =>
  expect(formQuery({ ...base, when: 'range', from: '2027-05-13', to: '2027-05-16', where: 'kyoto' }, ids)).toEqual({
    when: { kind: 'range', range: { start: '2027-05-13', end: '2027-05-16' } },
    where: 'kyoto',
    size: 10000,
  }));

test('month, empty and size', () => {
  expect(formQuery({ ...base, when: '2027-04', size: '100000' }, ids)).toEqual({ when: { kind: 'month', month: '2027-04' }, size: 100000 });
  expect(formQuery(base, ids)).toEqual({ size: 10000 });
});
