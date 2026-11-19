// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// サイトのURLはここだけに書く。SITE_URL があれば上書き（.com への切り替え用）
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://himekuri-tabi.idotworks-lab.workers.dev',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
