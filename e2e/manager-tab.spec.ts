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

  // New test case for slash key focus
  test('should focus search bar when "/" key is pressed', async ({ page, extensionId }) => {
    // Open the manager tab
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for the page to load (e.g., wait for the header)
    await page.locator('header').waitFor({ state: 'visible' });

    const searchBar = page.locator('#search-bar');

    // Verify search bar is not focused initially
    await expect(searchBar).not.toBeFocused();

    // Press '/' key using page.keyboard.press
    await page.keyboard.press('/');

    // Verify search bar is now focused
    await expect(searchBar).toBeFocused();

    // Verify pressing '/' again while focused doesn't change focus (and allows typing '/')
    await searchBar.press('/');
    await expect(searchBar).toBeFocused();
    await expect(searchBar).toHaveValue('/');
  });

  // Test for window group keyboard sequence navigation
  test('should focus window group with w+number sequence', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for window groups to load
    await page.locator('[data-window-group-number]').first().waitFor();

    // Get the actual window group number of the first group
    const firstGroupNumber = await page
      .locator('[data-window-group-number]')
      .first()
      .getAttribute('data-window-group-number');

    // Press w then the actual number of the first window group
    await page.keyboard.press('w');
    await page.keyboard.press(firstGroupNumber || '1');

    // Verify focus moved to first tab in first window group
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.closest('[data-window-group-number]')?.getAttribute('data-window-group-number');
    });

    expect(focusedElement).toBe(firstGroupNumber);
  });

  test('should timeout sequence after 3 seconds', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for window groups to load
    await page.locator('[data-window-group-number]').first().waitFor();

    // Press w to start sequence
    await page.keyboard.press('w');
    
    // Verify badge is visible
    const badge = page.locator('.badge.badge-primary.badge-lg');
    await expect(badge).toBeVisible();
    
    // Wait for 2 seconds (still within timeout)
    await page.waitForTimeout(2000);
    
    // Badge should still be visible
    await expect(badge).toBeVisible();
    
    // Wait for timeout to complete (additional 1.5 seconds = total 3.5 seconds)
    await page.waitForTimeout(1500);
    
    // Badge should now be hidden (sequence timed out)
    await expect(badge).not.toBeVisible();
    
    // Press 1 after timeout - should not navigate
    await page.keyboard.press('1');

    // Verify no navigation occurred (focus unchanged)
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focusedElement).not.toBe('LI');
  });

  test('should not activate when input is focused', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Focus search bar
    await page.locator('#search-bar').focus();

    // Try w sequence
    await page.keyboard.press('w');
    await page.keyboard.press('1');

    // Search bar should still have focus and contain 'w1'
    const focusedId = await page.evaluate(() => document.activeElement?.id);
    expect(focusedId).toBe('search-bar');

    const searchBarValue = await page.locator('#search-bar').inputValue();
    expect(searchBarValue).toBe('w1');
  });

  test('should show visual feedback when sequence is active', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for window groups to load
    await page.locator('[data-window-group-number]').first().waitFor();

    // Press w to activate sequence
    await page.keyboard.press('w');

    // Check if visual feedback is shown
    const badge = page.locator('.badge.badge-primary.badge-lg');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Press 0-9 to jump to Window Group');

    // Press 1 to complete sequence
    await page.keyboard.press('1');

    // Badge should disappear
    await expect(badge).not.toBeVisible();
  });

  test('should focus current window with w+0', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for window groups to load
    await page.locator('[data-window-group-number]').first().waitFor();

    // Get current window ID
    const currentWindowId = await page.evaluate(() => {
      // Find the active window element
      const activeWindow = document.querySelector('.collapse-title .text-green-600')?.closest('[data-window-id]');
      return activeWindow?.getAttribute('data-window-id');
    });

    if (currentWindowId) {
      // Press w then 0
      await page.keyboard.press('w');
      await page.keyboard.press('0');

      // Verify focus moved to current window
      const focusedWindowId = await page.evaluate(() => {
        return document.activeElement?.closest('[data-window-id]')?.getAttribute('data-window-id');
      });

      expect(focusedWindowId).toBe(currentWindowId);
    }
  });

  test('should cancel sequence with ESC key', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for window groups to load
    await page.locator('[data-window-group-number]').first().waitFor();

    // Press w to activate sequence
    await page.keyboard.press('w');

    // Check if visual feedback is shown
    const badge = page.locator('.badge.badge-primary.badge-lg');
    await expect(badge).toBeVisible();

    // Press ESC to cancel sequence
    await page.keyboard.press('Escape');

    // Badge should disappear immediately
    await expect(badge).not.toBeVisible();

    // Pressing number key should not trigger navigation
    await page.keyboard.press('1');

    // Verify focus has not changed to any tab item
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focusedElement).not.toBe('LI');
  });

  test('should navigate to window group 1 when checkbox focused (multiple windows)', async ({ page, extensionId }) => {
    // First, open the manager tab to establish extension context
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Create a new window and store its ID for cleanup
    const newWindowId = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        chrome.windows.create(
          {
            url: 'https://example.com',
            type: 'normal',
          },
          window => {
            if (window && window.id) {
              resolve(window.id);
            }
          }
        );
      });
    });

    try {
      // Wait for the new window to be recognized
      await page.waitForTimeout(2000);

      // Reload the manager tab to get updated window list
      await page.reload();

      // Verify that 2 window groups exist
      await page.locator('[data-window-group-number="1"]').waitFor({ timeout: 5000 });
      const windowGroupCount = await page.locator('[data-window-group-number]').count();
      expect(windowGroupCount).toBe(2);

      // Focus on the first collapse checkbox
      const collapseCheckbox = page.locator('input[id^="window-group-collapse-"]').first();
      await collapseCheckbox.focus();

      // Verify checkbox is focused
      const checkboxId = await collapseCheckbox.getAttribute('id');
      const focusedId = await page.evaluate(() => document.activeElement?.id);
      expect(focusedId).toBe(checkboxId);

      // Press w to activate sequence
      await page.keyboard.press('w');

      // Check if visual feedback is shown
      const badge = page.locator('.badge.badge-primary.badge-lg');
      await expect(badge).toBeVisible();

      // Press 1 to navigate to window group 1
      await page.keyboard.press('1');

      // Verify navigation occurred to window group 1 (second window)
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.closest('[data-window-group-number]')?.getAttribute('data-window-group-number');
      });
      expect(focusedElement).toBe('1');
    } finally {
      // Cleanup: close only the window we created with proper wait
      try {
        await page.evaluate((windowId) => {
          return new Promise<void>((resolve) => {
            chrome.windows.remove(windowId, () => {
              // Give Chrome time to fully clean up
              setTimeout(resolve, 100);
            });
          });
        }, newWindowId);
      } catch (e) {
        // Window might already be closed, which is fine
        console.log('Cleanup error (expected):', e);
      }
      
      // Additional wait to ensure window is fully closed
      await page.waitForTimeout(200);
    }
  });

  test('should not navigate when pressing 1 with single window', async ({ page, extensionId }) => {
    // Open the manager tab (single window environment)
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait and verify only 1 window group exists
    await page.waitForTimeout(500);
    const windowGroupCount = await page.locator('[data-window-group-number]').count();
    expect(windowGroupCount).toBe(1);

    // Focus on the collapse checkbox
    const collapseCheckbox = page.locator('input[id^="window-group-collapse-"]').first();
    await collapseCheckbox.focus();

    // Verify checkbox is focused
    const checkboxId = await collapseCheckbox.getAttribute('id');
    const focusedId = await page.evaluate(() => document.activeElement?.id);
    expect(focusedId).toBe(checkboxId);

    // Press w to activate sequence
    await page.keyboard.press('w');

    // Check if visual feedback is shown
    const badge = page.locator('.badge.badge-primary.badge-lg');
    await expect(badge).toBeVisible();

    // Press 1 to attempt navigation
    await page.keyboard.press('1');

    // Verify checkbox still has focus (no navigation occurred)
    const stillFocusedId = await page.evaluate(() => document.activeElement?.id);
    expect(stillFocusedId).toBe(checkboxId);

    // Badge should disappear
    await expect(badge).not.toBeVisible();
  });

  test('should allow w sequence on tab checkbox focus', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for window groups to load
    await page.locator('[data-window-group-number]').first().waitFor();

    // Focus on a tab checkbox
    const tabCheckbox = page.locator('input[id^="tab-"]').first();
    await tabCheckbox.focus();

    // Verify tab checkbox is focused
    const checkboxId = await tabCheckbox.getAttribute('id');
    const focusedId = await page.evaluate(() => document.activeElement?.id);
    expect(focusedId).toBe(checkboxId);

    // Press w to activate sequence
    await page.keyboard.press('w');

    // Check if visual feedback is shown
    const badge = page.locator('.badge.badge-primary.badge-lg');
    await expect(badge).toBeVisible();

    // Press 2 to navigate to second window group
    await page.keyboard.press('2');

    // Badge should disappear
    await expect(badge).not.toBeVisible();

    // Verify navigation occurred to window group 2
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.closest('[data-window-group-number]')?.getAttribute('data-window-group-number');
    });

    // Only check if there are at least 2 window groups
    const windowGroupCount = await page.locator('[data-window-group-number]').count();
    if (windowGroupCount >= 2) {
      expect(focusedElement).toBe('2');
    }
  });
});
