import * as c from '../src/config';

test('constants match spec', () => {
  expect(c.RADIUS_KM).toBe(50);
  expect(c.SIZE_DEFAULT).toBe(10000);
  expect(c.SIZE_STEPS).toEqual([10000, 100000, 1000000]);
  expect(c.SHIFT_MAX_DAYS).toBe(3);
  expect(c.SHIFT_MAX_SUGGESTIONS).toBe(2);
  expect(c.CROWD_THRESHOLD).toBe(1000000);
  expect(c.TARGET_YEAR).toBe(2027);
  expect(c.RAKUTEN_AFFILIATE_ID).toBe('');
});
