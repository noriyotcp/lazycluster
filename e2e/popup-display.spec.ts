import { test, expect } from './fixtures';

test.describe('Popup UI display', () => {
  test('should display popup UI and open manager tab', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const windowManagerButton = page.locator('button:has-text("Window Manager")');
    expect(windowManagerButton).toBeVisible();

    await windowManagerButton.click();
  });
});
