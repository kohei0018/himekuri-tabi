import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = (...p: string[]) => join(__dirname, '..', '..', 'dist', ...p);
const site = process.env.SITE_URL ?? 'https://himekuri-tabi.pages.dev';

test('robots.txt points to the sitemap on the configured site', () =>
  expect(readFileSync(dist('robots.txt'), 'utf8')).toContain(`Sitemap: ${site}/sitemap-index.xml`));

test('sitemap lists event pages', () => expect(readFileSync(dist('sitemap-0.xml'), 'utf8')).toContain(`${site}/events/kyoto-aoi-matsuri/`));

test('404 page exists', () => expect(existsSync(dist('404.html'))).toBe(true));

test('about page explains the data', () => {
  const html = readFileSync(dist('about', 'index.html'), 'utf8');
  expect(html).toContain('気象庁');
  expect(html).toContain('推計値');
  expect(html).toContain('github.com/kohei0018/himekuri-tabi/issues');
});
