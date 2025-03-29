import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pathToExtension = path.join(__dirname, '.output/chrome-mv3');

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: 'html',
  use: {
    ...devices['Desktop Chrome'],
    headless: false,
    channel: 'chromium',
    launchOptions: {
      args: [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`],
    },
  },
});
