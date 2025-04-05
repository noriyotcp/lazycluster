import { test } from './fixtures';

test.describe('Manager Tab E2E Tests', () => {
  test('manager tab should open and display window groups', async ({ page, extensionId }) => {
    // Open the manager tab
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Verify that the window group list is visible
    const windowGroupList = page.locator('.p-5.pt-0');
    await windowGroupList.waitFor({ state: 'visible', timeout: 10000 });

    // TODO: Add checks for the displayed window group and tabs
  });
});
