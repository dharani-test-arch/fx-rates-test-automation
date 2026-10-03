import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;

// No browser here: these tests talk to the GraphQL server over HTTP using Playwright's
// `request` fixture, so they are fast and need no browser install in CI.
export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }], ['allure-playwright']],
  use: { baseURL: 'http://localhost:4000' },
  webServer: {
    command: 'npm run start -w apps/graphql-server',
    cwd: '../..',
    port: 4000,
    reuseExistingServer: !isCI,
  },
});
