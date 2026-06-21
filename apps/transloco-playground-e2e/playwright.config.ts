import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

// CI serves the production build; local development serves the dev build and
// reuses an already-running dev server when present.
const isCI = !!process.env['CI'];
const serveConfiguration = isCI ? 'production' : 'development';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  testMatch: '**/*.spec.ts',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    viewport: { width: 1536, height: 960 },
    video: 'off',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  /* Run the playground dev/prod server before starting the tests */
  webServer: {
    command: `npx nx run transloco-playground:serve:${serveConfiguration} --port=4200`,
    url: baseURL,
    reuseExistingServer: !isCI,
    cwd: workspaceRoot,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1536, height: 960 },
      },
    },
  ],
});
