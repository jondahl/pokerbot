import { defineConfig } from 'vitest/config';
import path from 'path';
import * as dotenv from 'dotenv';

// Load .env file for tests
dotenv.config({ path: '.env' });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts'],
    testTimeout: 30000, // 30 seconds for API calls
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
