import { searchLinkFor, hotelLink, statusLabel, affiliateWrap } from '../src/lib/links';
import { areas, ev, d } from './fixtures';

const tenjin = ev({ name: '天神祭', prefecture: '大阪府', city: '大阪市', lat: 34.6957, lng: 135.5126, nearest: { city: '大阪市' }, dates: [d('2027-07-24', '2027-07-25')] });

test('searchLinkFor points to the first month and nearest area (relative)', () =>
  expect(searchLinkFor(tenjin, areas)).toBe('/?when=2027-07&where=osaka'));

test('statusLabel', () => {
  expect(statusLabel('confirmed')).toBe('確定');
  expect(statusLabel('estimated')).toBe('推定');
  expect(statusLabel('normal')).toBe('平年値');
});

test('hotelLink without affiliate id is a plain Rakuten Travel URL with the city', () => {
  const u = hotelLink(tenjin);
  expect(u.startsWith('https://kw.travel.rakuten.co.jp/')).toBe(true);
  expect(decodeURIComponent(u)).toContain('大阪市');
});

test('affiliateWrap wraps only when an id is given', () => {
  expect(affiliateWrap('https://travel.rakuten.co.jp/', '')).toBe('https://travel.rakuten.co.jp/');
  expect(affiliateWrap('https://travel.rakuten.co.jp/', 'abc.123')).toBe(
    'https://hb.afl.rakuten.co.jp/hgc/abc.123/?pc=https%3A%2F%2Ftravel.rakuten.co.jp%2F',
  );
});
