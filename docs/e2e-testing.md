# E2E Testing with Playwright

This document provides information about end-to-end testing with Playwright in this project.

## Setup

To set up Playwright for E2E testing, follow these steps:

1.  Install Playwright:

    ```bash
    npm install -D @playwright/test
    ```

2.  Configure `fixtures.ts`:

    - Set the correct extension path.
    - Use `path.resolve` to dynamically resolve the extension path.

    ```typescript
    import { test as base, chromium, type BrowserContext } from '@playwright/test';
    import path from 'path';
    import { fileURLToPath } from 'url';
    import { dirname } from 'path';

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    export const test = base.extend&#x3C;{
      context: BrowserContext;
      extensionId: string;
    }>({
      context: async ({}, use) => {
        const pathToExtension = path.resolve(__dirname, '..', '.output', 'chrome-mv3');
        const userDataDir = path.join(__dirname, 'user-data-dir');
        const context = await chromium.launchPersistentContext(userDataDir, {
          headless: false,
          args: [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`],
        });
        await use(context);
        await context.close();
      },
      extensionId: async ({ context }, use) => {
        let [background] = await context.serviceWorkers();
        if (!background) {
          background = await context.waitForEvent('serviceworker');
        }
        const extensionId = background.url().split('/')[2];
        await use(extensionId);
      },
    });

    export const expect = test.expect;
    ```

## Error Handling

### `__dirname` Error

- The `__dirname` error occurs when the relative path is not correctly resolved.
- Use `path.resolve` to dynamically resolve the extension path.

### Test Timeout

- Test timeouts can occur due to various reasons.
- Check the test configurations and adjust accordingly.

## Test Examples

### Popup UI Test

- `popup-display.spec.ts` provides an example of testing the popup UI.

  ```typescript
  import { test, expect } from './fixtures';

  test.describe('Popup UI display', () => {
    test('should display popup UI and open manager tab', async ({ page, extensionId }) => {
      await page.goto(`chrome-extension://${extensionId}/popup.html`);

      const windowManagerButton = page.locator('button:has-text("Window Manager")');
      expect(windowManagerButton).toBeVisible();

      await windowManagerButton.click();
    });
  });
  ```
