import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const pathToExtension = path.resolve(__dirname, '..', '.output', 'chrome-mv3');
    const userDataDir = path.join(__dirname, 'user-data-dir', Date.now().toString()); // Unique directory for each test
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: true,
      args: ['--headless=new', `--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`],
    });
    // Add init script for extension initialization
    await context.addInitScript(() => {
      window.localStorage.setItem('com.example.lang', 'ja');
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // e2e/fixtures.ts
    const background = await context.waitForEvent('serviceworker', { timeout: 90000 }); // use serviceworker event
    if (!background || !background.url()) {
      throw new Error('Background page or URL not available');
    }
    console.log('Background serviceworker URL:', background.url());
    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});

export const expect = test.expect;
