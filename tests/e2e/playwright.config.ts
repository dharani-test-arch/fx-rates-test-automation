import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['blob'], ['list']] : [['list'], ['html', { open: 'never' }]],
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
    use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || undefined },
  },
],
});
