import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Separate config so the live accuracy eval (real LLM calls) never runs in the
// normal `npm test` suite. Run it on demand with `npm run eval`.
export default defineConfig({
  test: {
    include: ['eval/**/*.eval.ts'],
    testTimeout: 180_000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
