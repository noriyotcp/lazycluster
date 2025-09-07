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
    // Use timestamp + random string for truly unique directory names
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const userDataDir = path.join(__dirname, 'user-data-dir', uniqueId);

    // Ensure the directory doesn't exist (with retry logic)
    let retries = 0;
    let finalUserDataDir = userDataDir;
    while (fs.existsSync(finalUserDataDir) && retries < 3) {
      const newUniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}-retry${retries}`;
      finalUserDataDir = path.join(__dirname, 'user-data-dir', newUniqueId);
      retries++;
    }

    if (fs.existsSync(finalUserDataDir)) {
      // Force remove if it still exists after retries
      fs.rmSync(finalUserDataDir, { recursive: true, force: true });
    }

    let context;
    try {
      context = await chromium.launchPersistentContext(finalUserDataDir, {
        headless: process.env.HEADLESS !== 'false',
        args: [
          process.env.HEADLESS !== 'false' ? '--headless=new' : '',
          `--disable-extensions-except=${pathToExtension}`,
          `--load-extension=${pathToExtension}`,
        ],
      });
      // Add init script for extension initialization
      await context.addInitScript(() => {
        window.localStorage.setItem('com.example.lang', 'ja');
      });
      await use(context);
    } finally {
      // Ensure cleanup happens even if test fails
      if (context) {
        await context.close();
      }
      // Clean up the user data directory
      if (fs.existsSync(finalUserDataDir)) {
        try {
          fs.rmSync(finalUserDataDir, { recursive: true, force: true });
        } catch (err) {
          console.warn(`Failed to clean up user data directory ${finalUserDataDir}:`, err);
        }
      }
    }
  },
  extensionId: async ({ context }, use) => {
    const background = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker', { timeout: 60000 })); // use serviceworker event
    if (!background || !background.url()) {
      throw new Error('Background page or URL not available');
    }
    console.log('Background serviceworker URL:', background.url());
    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});

export const expect = test.expect;
