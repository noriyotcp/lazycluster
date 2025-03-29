import { test, expect } from '@playwright/test';

test.describe('Popup UI display', () => {
  test('should display popup UI and open manager tab', async ({ page, browser }) => {
    const backgroundPage = await browser.newPage();
    const extensionId = await backgroundPage.evaluate(() => chrome.runtime.id);
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const windowManagerButton = page.locator('button:has-text("Window Manager")');
    await expect(windowManagerButton).toBeVisible();

    await windowManagerButton.click();
  });
});
