import { defineConfig } from 'vitest/config';

// npm run build のあとに走らせる、dist/ を読むテスト
export default defineConfig({
  test: { globals: true, environment: 'node', include: ['tests/build/**/*.test.ts'] },
});
