import { eventFileSchema, areaSchema } from '../src/lib/schema';

const aoi = {
  id: 'kyoto-aoi-matsuri',
  name: '葵祭',
  kind: 'event',
  genre: ['伝統行事'],
  country: 'JP',
  region: 'domestic',
  prefecture: '京都府',
  city: '京都市',
  lat: 35.0254,
  lng: 135.7621,
  nearest: { city: '京都市', airport: 'ITM' },
  summary: '平安装束の行列が進む。',
  official_url: 'https://example.org/aoi',
  attendance: { value: 30000, basis: '主催者発表', source_url: 'https://example.org/a' },
  rules: [{ type: 'fixed', month: 5, day: 15 }],
  occurrences: [{ year: 2027, status: 'estimated' }],
};
const clone = (o: object) => structuredClone(o) as any;
const ok = (o: unknown) => eventFileSchema.safeParse(o).success;

test('valid event passes', () => expect(ok(aoi)).toBe(true));

test('event without attendance fails', () => {
  const e = clone(aoi); delete e.attendance;
  expect(ok(e)).toBe(false);
});

test('confirmed without dates or source_url fails', () => {
  const a = clone(aoi); a.occurrences = [{ year: 2027, status: 'confirmed', source_url: 'https://x.org' }];
  const b = clone(aoi); b.occurrences = [{ year: 2027, status: 'confirmed', dates: [{ start: '2027-05-15', end: '2027-05-15' }] }];
  expect(ok(a)).toBe(false);
  expect(ok(b)).toBe(false);
});

test('bloom without bloom block fails', () => {
  const e = clone(aoi); e.kind = 'bloom'; delete e.attendance; delete e.rules;
  e.occurrences = [{ year: 2027, status: 'normal' }];
  expect(ok(e)).toBe(false);
  e.bloom = { station: '京都', flowering: '03-26', full_bloom: '04-04', forecast_url: 'https://tenki.jp/sakura/' };
  expect(ok(e)).toBe(true);
});

test('bloom or exhibition with attendance fails', () => {
  const e = clone(aoi); e.kind = 'exhibition';
  expect(ok(e)).toBe(false);
});

test('id must be lowercase kebab', () => {
  const e = clone(aoi); e.id = 'Kyoto_Aoi';
  expect(ok(e)).toBe(false);
});

test('manual rule needs dates for the occurrence', () => {
  const e = clone(aoi); e.rules = [{ type: 'manual' }];
  expect(ok(e)).toBe(false);
  e.occurrences = [{ year: 2027, status: 'estimated', dates: [{ start: '2027-04-01', end: '2027-04-01' }] }];
  expect(ok(e)).toBe(true);
});

test('date range end before start fails', () => {
  const e = clone(aoi);
  e.occurrences = [{ year: 2027, status: 'estimated', dates: [{ start: '2027-05-16', end: '2027-05-15' }] }];
  expect(ok(e)).toBe(false);
});

test('area schema', () => {
  expect(areaSchema.safeParse({ id: 'kyoto', name: '京都市', prefecture: '京都府', lat: 35.0, lng: 135.7 }).success).toBe(true);
  expect(areaSchema.safeParse({ id: 'kyoto', name: '京都市' }).success).toBe(false);
});

test('impossible dates and mismatched years fail', () => {
  const a = clone(aoi); a.occurrences = [{ year: 2027, status: 'estimated', dates: [{ start: '2027-04-31', end: '2027-04-31' }] }];
  const b = clone(aoi); b.occurrences = [{ year: 2027, status: 'estimated', dates: [{ start: '2026-05-15', end: '2026-05-15' }] }];
  const c = clone(aoi); c.kind = 'bloom'; delete c.attendance; delete c.rules; c.occurrences = [{ year: 2027, status: 'normal' }];
  c.bloom = { station: '京都', flowering: '13-45', full_bloom: '04-04', forecast_url: 'https://tenki.jp/sakura/' };
  expect(ok(a)).toBe(false);
  expect(ok(b)).toBe(false);
  expect(ok(c)).toBe(false);
});
