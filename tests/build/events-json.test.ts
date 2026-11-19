import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const json = JSON.parse(readFileSync(join(__dirname, '..', '..', 'dist', 'data', 'events.json'), 'utf8'));
const byId = (id: string) => json.events.find((e: { id: string }) => e.id === id);

test('events.json has the target year, areas and all sample events', () => {
  expect(json.year).toBe(2027);
  expect(json.areas).toHaveLength(13);
  expect(json.events).toHaveLength(6);
});

test('dates are resolved at build time', () => {
  expect(byId('kyoto-aoi-matsuri').dates).toEqual([{ start: '2027-05-15', end: '2027-05-15' }]);
  expect(byId('kyoto-aoi-matsuri').ruleText).toBe('毎年5月15日');
  expect(byId('kyoto-sakura').status).toBe('normal');
  expect(byId('kyoto-sakura').forecastUrl).toBe('https://tenki.jp/sakura/');
});
