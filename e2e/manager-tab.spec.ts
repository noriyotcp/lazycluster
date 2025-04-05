import { test, expect } from './fixtures';

test.describe('Manager Tab E2E Tests', () => {
  test('manager tab should open and display window groups', async ({ page, extensionId }) => {
    // Open the manager tab
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Verify that the window group list is visible
    const windowGroupList = page.locator('.p-5.pt-0');
    await windowGroupList.waitFor({ state: 'visible', timeout: 10000 });

    // TODO: Add checks for the displayed window group and tabs
    expect(windowGroupList.locator('.collapse').first()).toBeVisible();

    // Verify that at least one window group is displayed
    const windowGroups = await windowGroupList.locator('.collapse').count();
    expect(windowGroups).toBeGreaterThan(0);

    // Verify that each window group has at least one tab
    for (let i = 0; i < windowGroups; i++) {
      const tabCount = await windowGroupList.locator('.collapse').nth(i).locator(`.group\\/tabitem`).count();
      expect(tabCount).toBeGreaterThan(0);

      // Verify that the tab title is correct (This requires access to the actual tab titles, which might be tricky)
      // const tabTitle = await windowGroupList.locator('.collapse').nth(i).locator('.tab-item a').first().textContent();
      // expect(tabTitle).toBe('Expected Tab Title'); // Replace with actual tab title

      // Click the window group to collapse it
      const collapseCheckbox = windowGroupList
        .locator('.collapse')
        .nth(i)
        .locator('input[id^="window-group-collapse-"]');
      await collapseCheckbox.waitFor({ state: 'attached' });
      await collapseCheckbox.click();
      // Wait for the collapse content to be hidden
      await windowGroupList
        .locator('.collapse')
        .nth(i)
        .locator('.collapse-content')
        .waitFor({ state: 'hidden', timeout: 10000 });
    }
  });
});
