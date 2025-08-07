import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: 'html',
  globalSetup: fileURLToPath(new URL('./global-setup', import.meta.url)),
  use: {
    headless: true, // Set headless mode to true by default
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        launchOptions: {
          args: [],
        },
        storageState: 'storageState.json',
      },
    },
  ],
});
