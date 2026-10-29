import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', timeout: 45000, fullyParallel: false,
  use: { baseURL: process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3001', browserName: 'chromium', channel: 'msedge', headless: true, viewport: { width: 1440, height: 960 }, trace: 'retain-on-failure' },
  reporter: 'list'
});
