import { defineConfig, devices } from '@playwright/test';

// SproutLab Phase 2 arming — hermetic local serve, chromium only, retries: 0 (R-6).
// CT-10 lesson: bundled chromium does not trust sandbox MITM CAs, so we serve locally
// rather than pointing at the live deploy.
const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    actionTimeout: 8_000,
    navigationTimeout: 15_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `node tests/e2e/server.mjs ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
