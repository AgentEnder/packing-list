import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:3000';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './e2e' }),
  testDir: './src',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Enable storage persistence for IndexedDB tests */
    storageState: undefined, // Don't use global storage state
    video: 'retain-on-failure',
  },
  /* Global setup for all tests */
  globalSetup: undefined,
  globalTeardown: undefined,
  // Snapshot tests are only checked on Linux to avoid issues with
  // screenshot tests. If you have added or modified a snapshot test,
  // running `nx update-snapshots frontend-e2e` will run in a linux container.
  ignoreSnapshots: process.env.CI ? false : process.platform !== 'linux',
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npx nx serve-static frontend',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    cwd: workspaceRoot,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
          /* Chrome args to ensure IndexedDB works properly */
          args: [
            '--allow-running-insecure-content',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--enable-experimental-web-platform-features',
            '--unlimited-storage',
          ],
        },
        /* Ensure each test has fresh storage context */
        storageState: undefined,
      },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Uncomment for mobile browsers support
    /* {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }, */

    // Uncomment for branded browsers
    /* {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    } */
  ],
});
