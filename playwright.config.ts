import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  globalSetup: fileURLToPath(new URL('./global-setup', import.meta.url)),
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        launchOptions: {
          args: [process.env.HEADLESS !== 'false' ? '--headless=new' : ''],
        },
        storageState: 'storageState.json',
      },
    },
  ],
});
