import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const page = (id: string) => readFileSync(join(__dirname, '..', '..', 'dist', 'events', id, 'index.html'), 'utf8');
const site = process.env.SITE_URL ?? 'https://himekuri-tabi.pages.dev';

test('event page has title and absolute OGP from the site setting', () => {
  const html = page('kyoto-aoi-matsuri');
  expect(html).toMatch(/<title>葵祭/);
  expect(html).toContain(`<meta property="og:url" content="${site}/events/kyoto-aoi-matsuri/">`);
  expect(html).toContain(`<meta property="og:image" content="${site}/og-default.png">`);
  expect(html).toContain(`<link rel="canonical" href="${site}/events/kyoto-aoi-matsuri/">`);
});

test('estimated event shows the rule; bloom shows source and forecast link', () => {
  expect(page('kyoto-aoi-matsuri')).toContain('毎年5月15日');
  const sakura = page('kyoto-sakura');
  expect(sakura).toContain('平年値');
  expect(sakura).toContain('気象庁');
  expect(sakura).toContain('https://tenki.jp/sakura/');
});

test('no hard-coded host other than the site setting', () => {
  const html = page('naha-hari');
  const hosts = [...html.matchAll(/https:\/\/himekuri-tabi\.pages\.dev/g)];
  if (site !== 'https://himekuri-tabi.pages.dev') expect(hosts).toHaveLength(0);
});
