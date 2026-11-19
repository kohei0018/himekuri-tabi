import { distanceKm } from '../src/lib/geo';

const kyoto = { lat: 35.0116, lng: 135.7681 };
test('Kyoto city hall to Osaka Tenmangu is 40-45km', () => {
  const d = distanceKm(kyoto, { lat: 34.6957, lng: 135.5126 });
  expect(d).toBeGreaterThan(40);
  expect(d).toBeLessThan(45);
});
test('Kyoto to Sapporo is over 900km', () => expect(distanceKm(kyoto, { lat: 43.0621, lng: 141.3544 })).toBeGreaterThan(900));
test('same point is 0', () => expect(distanceKm(kyoto, kyoto)).toBe(0));
