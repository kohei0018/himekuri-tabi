import { defineConfig, configDefaults } from 'vitest/config';

// ユニットテスト。ビルド結果（dist/）を読むテストは vitest.build.config.ts で別に走らせる
export default defineConfig({
  test: { globals: true, environment: 'node', include: ['tests/**/*.test.ts'], exclude: [...configDefaults.exclude, 'tests/build/**'] },
});
