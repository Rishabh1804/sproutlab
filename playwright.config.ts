import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// SproutLab Phase 2 arming — hermetic local serve, chromium only, retries: 0 (R-6).
// CT-10 lesson: bundled chromium does not trust sandbox MITM CAs, so we serve locally
// rather than pointing at the live deploy.
const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;
const baseURL = `http://127.0.0.1:${PORT}`;
// The fixture's localStorage is keyed by origin. Read it here and point it at the origin actually
// served, so a run on another PORT still loads the invented child's profile instead of silently
// leaving the gate up (BUGS.md S2–S4 #12).
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'tests/e2e/fixtures/storage.json'), 'utf8'));
fixture.origins = (fixture.origins || []).map((o: any) => ({ ...o, origin: baseURL }));

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: {
    // Every test starts with an invented child's profile (HR-13: never a real one), so the
    // privacy gate (docs/specs/privacy-v1.md §3.3) stays closed unless a test clears it.
    storageState: fixture,
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
