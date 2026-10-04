import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI
    ? [['blob'], ['allure-playwright'], ['list']]
    : [['list'], ['html', { open: 'never' }], ['allure-playwright']],
  expect: {
    // A small tolerance absorbs sub-pixel anti-aliasing noise without hiding real layout changes.
    toHaveScreenshot: { maxDiffPixelRatio: 0.002 },
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Start the real stack: GraphQL server first, then the web app (which proxies to it).
  webServer: [
    {
      command: 'npm run dev -w apps/graphql-server',
      cwd: '../..',
      port: 4000,
      reuseExistingServer: !isCI,
    },
    {
      command: 'npm run dev -w apps/web',
      cwd: '../..',
      port: 5173,
      reuseExistingServer: !isCI,
    },
  ],
  projects: [
    {
      name: 'chromium',
      testIgnore: /visual\.spec\.ts/,
      // Locally on a locked-down machine: set PW_CHANNEL=msedge to use the installed Edge.
      // CI leaves it unset and uses Playwright's bundled Chromium.
      use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || undefined },
    },
    {
      // Always bundled Chromium with a fixed viewport, so screenshots are comparable run to run.
      name: 'visual',
      testMatch: /visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
    },
  ],
});
