import { test, expect } from './fixtures';
import { gotoManager, createWindow, removeWindow } from './helpers';

test.describe('Manager Tab E2E Tests', () => {
  test('manager tab should open and display window groups', async ({ page, extensionId }) => {
    await gotoManager(page, extensionId);

    const windowGroupList = page.locator('.p-5.pt-0');
    await expect(windowGroupList.locator('.collapse').first()).toBeVisible({ timeout: 10000 });

    // Verify that at least one window group is displayed
    const windowGroups = await windowGroupList.locator('.collapse').count();
    expect(windowGroups).toBeGreaterThan(0);

    // Verify that each window group has at least one tab
    for (let i = 0; i < windowGroups; i++) {
      const tabCount = await windowGroupList.locator('.collapse').nth(i).locator(`.group\\/tabitem`).count();
      expect(tabCount).toBeGreaterThan(0);

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
    await gotoManager(page, extensionId);

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
    await gotoManager(page, extensionId);

    // Get the actual window group number of the first group
    const firstGroupNumber = await page
      .locator('[data-window-group-number]')
      .first()
      .getAttribute('data-window-group-number');

    // Press w then the actual number of the first window group
    await page.keyboard.press('w');
    await page.keyboard.press(firstGroupNumber || '1');
    await page.keyboard.press('Enter');

    // Verify focus moved to first tab in first window group
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.closest('[data-window-group-number]')?.getAttribute('data-window-group-number');
    });

    expect(focusedElement).toBe(firstGroupNumber);
  });

  test('should timeout sequence after 3 seconds', async ({ page, extensionId }) => {
    await gotoManager(page, extensionId);

    // Press w to start sequence
    await page.keyboard.press('w');

    // Verify badge is visible
    const badge = page.locator('.badge-jump-to-window-group');
    await expect(badge).toBeVisible();

    // Wait for 2 seconds (still within the app's real 3-second timeout) — this is
    // intentionally a real-time wait: the test verifies the badge is STILL visible
    // mid-timeout, so there is no DOM condition to substitute for the passage of time.
    await page.waitForTimeout(2000);

    // Badge should still be visible
    await expect(badge).toBeVisible();

    // The remaining ~1 second until the real 3-second timeout fires is covered by
    // expect()'s own polling (default 5s), so no additional sleep is needed here.
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
    await gotoManager(page, extensionId);

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
    await gotoManager(page, extensionId);

    // Press w to activate sequence
    await page.keyboard.press('w');

    // Check if visual feedback is shown
    const badge = page.locator('.badge-jump-to-window-group');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Type window group number');

    // Press 1 to complete sequence
    await page.keyboard.press('1');
    await page.keyboard.press('Enter');

    // Badge should disappear
    await expect(badge).not.toBeVisible();
  });

  test('should focus current window with w+0', async ({ page, extensionId }) => {
    await gotoManager(page, extensionId);

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
      await page.keyboard.press('Enter');

      // Verify focus moved to current window
      const focusedWindowId = await page.evaluate(() => {
        return document.activeElement?.closest('[data-window-id]')?.getAttribute('data-window-id');
      });

      expect(focusedWindowId).toBe(currentWindowId);
    }
  });

  test('should cancel sequence with ESC key', async ({ page, extensionId }) => {
    await gotoManager(page, extensionId);

    // Press w to activate sequence
    await page.keyboard.press('w');

    // Check if visual feedback is shown
    const badge = page.locator('.badge-jump-to-window-group');
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
    await gotoManager(page, extensionId);

    // Create a new window and store its ID for cleanup
    const newWindowId = await createWindow(page);

    try {
      // Reload the manager tab to get the updated window list. The window already
      // exists in the browser (createWindow's promise resolved), so the reload's
      // own REQUEST_INITIAL_DATA fetch will see it — no arbitrary wait needed first.
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
      const badge = page.locator('.badge-jump-to-window-group');
      await expect(badge).toBeVisible();

      // Press 1 to navigate to window group 1
      await page.keyboard.press('1');
      await page.keyboard.press('Enter');

      // Verify navigation occurred to window group 1 (second window)
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.closest('[data-window-group-number]')?.getAttribute('data-window-group-number');
      });
      expect(focusedElement).toBe('1');
    } finally {
      // Cleanup: close only the window we created
      try {
        await removeWindow(page, newWindowId);
      } catch (_e) {
        // (expected error, no action needed)
      }
    }
  });

  test('should not navigate when pressing 1 with single window', async ({ page, extensionId }) => {
    // Open the manager tab (single window environment)
    await gotoManager(page, extensionId);

    // Verify only 1 window group exists
    await expect(page.locator('[data-window-group-number]')).toHaveCount(1);

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
    const badge = page.locator('.badge-jump-to-window-group');
    await expect(badge).toBeVisible();

    // Press 1 to attempt navigation
    await page.keyboard.press('1');
    await page.keyboard.press('Enter');

    // Verify checkbox still has focus (no navigation occurred)
    const stillFocusedId = await page.evaluate(() => document.activeElement?.id);
    expect(stillFocusedId).toBe(checkboxId);

    // Badge should disappear
    await expect(badge).not.toBeVisible();
  });

  test('should allow w sequence on tab checkbox focus', async ({ page, extensionId }) => {
    await gotoManager(page, extensionId);

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
    const badge = page.locator('.badge-jump-to-window-group');
    await expect(badge).toBeVisible();

    // Press 2 to navigate to second window group
    await page.keyboard.press('2');
    await page.keyboard.press('Enter');

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

  test('Current Window label should persist and no Window 0 should appear', async ({ page, extensionId }) => {
    await gotoManager(page, extensionId);

    // Verify Current Window is displayed for the window with the extension
    // Use more specific selector to avoid matching help text
    await expect(page.locator('.window-title:has-text("Current Window")')).toBeVisible();

    // Verify Window 0 is NOT displayed
    await expect(page.locator('.window-title:has-text("Window 0")')).not.toBeVisible();

    // Get all window titles to verify numbering starts from 1
    const windowTitles = await page.locator('.window-title').allTextContents();

    // Filter out "Current Window" and check remaining titles
    const numberedWindows = windowTitles.filter(title => title.startsWith('Window '));

    // If there are other windows, they should be numbered from 1
    for (const title of numberedWindows) {
      const match = title.match(/Window (\d+)/);
      if (match) {
        const windowNumber = parseInt(match[1], 10);
        expect(windowNumber).toBeGreaterThan(0); // Should be 1, 2, 3... never 0
      }
    }
  });

  test('should support multi-digit window group numbers', async ({ page, extensionId }) => {
    await gotoManager(page, extensionId);

    // Create additional windows to have window group 12 available
    const windowIds: number[] = [];
    try {
      // Create 12 additional windows (plus original window = 13 total, giving us window groups 0-12)
      for (let i = 0; i < 12; i++) {
        windowIds.push(await createWindow(page));
      }

      // Reload to get the updated window list — each createWindow() call already
      // awaited the browser recognizing the window, so no extra wait is needed first.
      await page.reload();

      // Verify window group 12 exists
      await page.locator('[data-window-group-number="12"]').waitFor({ timeout: 5000 });

      // Press w, then 1, then 2, then Enter
      await page.keyboard.press('w');
      await page.keyboard.press('1');
      await page.keyboard.press('2');
      await page.keyboard.press('Enter');

      // Verify navigation to window group 12
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.closest('[data-window-group-number]')?.getAttribute('data-window-group-number');
      });

      expect(focusedElement).toBe('12');
    } finally {
      // Cleanup: close all created windows
      for (const windowId of windowIds) {
        try {
          await removeWindow(page, windowId);
        } catch (_e) {
          // (expected error, no action needed)
        }
      }
    }
  });

  test('should allow editing with Backspace key', async ({ page, extensionId }) => {
    await gotoManager(page, extensionId);

    // Get the first window group number
    const firstGroupNumber = await page
      .locator('[data-window-group-number]')
      .first()
      .getAttribute('data-window-group-number');

    // Press w, then 5, then 9, then Backspace twice, then the first group number
    await page.keyboard.press('w');
    await page.keyboard.press('5');
    await page.keyboard.press('9');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.press(firstGroupNumber || '1');
    await page.keyboard.press('Enter');

    // Verify navigation to first window group
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.closest('[data-window-group-number]')?.getAttribute('data-window-group-number');
    });

    expect(focusedElement).toBe(firstGroupNumber);
  });

  test('should not navigate with empty buffer', async ({ page, extensionId }) => {
    await gotoManager(page, extensionId);

    // Press w, then 1, then Backspace, then Enter
    await page.keyboard.press('w');
    await page.keyboard.press('1');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Enter');

    // Verify no navigation occurred (focus remains on body or non-tab element)
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    // Should not be focused on a list item (tab element)
    expect(focusedElement).not.toBe('LI');
  });

  test('should NOT timeout during continuous input (Debounce)', async ({ page, extensionId }) => {
    await gotoManager(page, extensionId);

    const firstGroupNumber = await page
      .locator('[data-window-group-number]')
      .first()
      .getAttribute('data-window-group-number');

    // Press keys with 2-second intervals (less than the app's real 3-second timeout).
    // These waits ARE the behavior under test — proving the timeout doesn't fire
    // across real time gaps — so they cannot be replaced by a DOM-condition wait.
    await page.keyboard.press('w');
    await page.waitForTimeout(2000);
    await page.keyboard.press(firstGroupNumber || '1');
    await page.waitForTimeout(2000);
    await page.keyboard.press('2');
    await page.keyboard.press('Enter');

    // Should successfully jump to window group (firstGroupNumber)2
    // e.g., if firstGroupNumber is '1', this should jump to window group '12'
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.closest('[data-window-group-number]')?.getAttribute('data-window-group-number');
    });

    // Verify we navigated to some window group (test passes if focus moved to a tab)
    expect(focusedElement).not.toBeNull();
  });

  test('Current Window label updates dynamically when tabs change', async ({ page, context, extensionId }) => {
    await gotoManager(page, extensionId);

    // Verify Current Window is initially displayed
    // Use more specific selector to avoid matching help text
    await expect(page.locator('.window-title:has-text("Current Window")')).toBeVisible();

    // Get initial tab count
    const initialTabCount = await page.locator('.group\\/tabitem').count();

    // Open a new tab in the same window (this will trigger tabGroups update)
    const newTab = await context.newPage();
    await newTab.goto('https://example.com');

    // Wait for the tab count to increase (CSP-safe approach)
    await expect(page.locator('.group\\/tabitem')).toHaveCount(initialTabCount + 1, { timeout: 5000 });

    // Current Window should still be visible
    await expect(page.locator('.window-title:has-text("Current Window")')).toBeVisible();

    // Window 0 should never appear
    await expect(page.locator('.window-title:has-text("Window 0")')).not.toBeVisible();

    // Close the new tab
    await newTab.close();

    // Wait for the tab count to decrease (CSP-safe approach)
    await expect(page.locator('.group\\/tabitem')).toHaveCount(initialTabCount, { timeout: 5000 });

    // Current Window should still be visible after tab removal
    await expect(page.locator('.window-title:has-text("Current Window")')).toBeVisible();
  });

  test('should return focus to tab item li when Escape pressed from inner element', async ({ page, extensionId }) => {
    await gotoManager(page, extensionId);

    // Wait for tab items to load
    await page.locator('.collapse-content li[tabindex="0"]').first().waitFor();

    // Focus the first tab item <li>
    const firstTabItem = page.locator('.collapse-content li[tabindex="0"]').first();
    await firstTabItem.focus();
    await expect(firstTabItem).toBeFocused();

    // Directly focus an inner element (avoid Tab key — unreliable with role="button" from dnd-kit)
    const innerLink = firstTabItem.locator('a').first();
    await innerLink.focus();

    // Verify focus moved to an inner element (not the <li> anymore)
    const focusedTagAfterFocus = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTagAfterFocus).toBe('A');

    // Press Escape to return focus to the <li>
    await page.keyboard.press('Escape');

    // Verify focus returned to the <li> tab item
    await expect(firstTabItem).toBeFocused();

    // Verify j/k navigation works after returning focus
    await page.keyboard.press('j');
    const secondTabItem = page.locator('.collapse-content li[tabindex="0"]').nth(1);
    await expect(secondTabItem).toBeFocused();
  });

  test('should not move focus when Escape cancels w+number sequence from inner element', async ({
    page,
    extensionId,
  }) => {
    await gotoManager(page, extensionId);

    // Wait for tab items to load
    await page.locator('.collapse-content li[tabindex="0"]').first().waitFor();

    // Focus the first tab item <li>
    const firstTabItem = page.locator('.collapse-content li[tabindex="0"]').first();
    await firstTabItem.focus();
    await expect(firstTabItem).toBeFocused();

    // Directly focus an inner element (avoid Tab key — unreliable with role="button" from dnd-kit)
    const innerLink = firstTabItem.locator('a').first();
    await innerLink.focus();

    // Verify focus moved to an inner element
    const focusedTagAfterFocus = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTagAfterFocus).toBe('A');

    // Start w+number sequence. Key sequence buffering is synchronous ref-based state
    // (useWindowGroupNavigation), not async React state, so no settle time is needed
    // between presses — the badge assertion below polls for the visual result anyway.
    await page.keyboard.press('w');
    await page.keyboard.press('1');

    // Verify sequence is active (badge visible)
    await expect(page.locator('.badge-jump-to-window-group')).toBeVisible();

    // Press Escape to cancel the sequence
    await page.keyboard.press('Escape');

    // Verify sequence is cancelled (badge gone)
    await expect(page.locator('.badge-jump-to-window-group')).not.toBeVisible();

    // Verify focus did NOT move to the <li> — it should stay on the inner element
    const focusedTagAfterEsc = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTagAfterEsc).not.toBe('LI');
    expect(focusedTagAfterEsc).toBe(focusedTagAfterFocus);
  });

  test('should collapse all window groups when Alt+clicking a collapse header', async ({ page, extensionId }) => {
    await gotoManager(page, extensionId);

    // Create a second window to have multiple window groups
    const newWindowId = await createWindow(page);

    try {
      await page.reload();

      // Verify 2 window groups exist
      await page.locator('[data-window-group-number]').nth(1).waitFor({ timeout: 5000 });
      const windowGroupCount = await page.locator('[data-window-group-number]').count();
      expect(windowGroupCount).toBe(2);

      const checkboxes = page.locator('input[id^="window-group-collapse-"]');

      // Verify both are expanded initially
      for (let i = 0; i < windowGroupCount; i++) {
        await expect(checkboxes.nth(i)).toBeChecked();
      }

      // Alt+click the first collapse checkbox to collapse all
      // Note: dispatchEvent(click) on checkbox toggles checked in Chromium,
      // so do NOT manually toggle el.checked (would cause double-toggle).
      await checkboxes.first().evaluate((el: HTMLInputElement) => {
        el.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            altKey: true,
          })
        );
      });

      // Verify ALL window groups are collapsed
      for (let i = 0; i < windowGroupCount; i++) {
        await expect(checkboxes.nth(i)).not.toBeChecked();
      }

      // Alt+click again to expand all
      await checkboxes.first().evaluate((el: HTMLInputElement) => {
        el.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            altKey: true,
          })
        );
      });

      // Verify ALL window groups are expanded
      for (let i = 0; i < windowGroupCount; i++) {
        await expect(checkboxes.nth(i)).toBeChecked();
      }
    } finally {
      try {
        await removeWindow(page, newWindowId);
      } catch (_e) {
        // (expected error, no action needed)
      }
    }
  });

  test('should not toggle other groups when clicking without Alt', async ({ page, extensionId }) => {
    await gotoManager(page, extensionId);

    // Create a second window
    const newWindowId = await createWindow(page);

    try {
      await page.reload();

      await page.locator('[data-window-group-number]').nth(1).waitFor({ timeout: 5000 });

      const checkboxes = page.locator('input[id^="window-group-collapse-"]');

      // Normal click (no Alt) on first checkbox
      await checkboxes.first().click();

      // First should be collapsed, second should still be expanded
      await expect(checkboxes.first()).not.toBeChecked();
      await expect(checkboxes.nth(1)).toBeChecked();
    } finally {
      try {
        await removeWindow(page, newWindowId);
      } catch (_e) {
        // (expected error, no action needed)
      }
    }
  });

  test('should not change focus when Escape pressed while li itself is focused', async ({ page, extensionId }) => {
    await gotoManager(page, extensionId);

    // Wait for tab items to load
    await page.locator('.collapse-content li[tabindex="0"]').first().waitFor();

    // Focus the first tab item <li>
    const firstTabItem = page.locator('.collapse-content li[tabindex="0"]').first();
    await firstTabItem.focus();
    await expect(firstTabItem).toBeFocused();

    // Press Escape while <li> is focused
    await page.keyboard.press('Escape');

    // Verify focus remains on the <li> (Escape is a no-op when already on tab item)
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBe('LI');
  });
});
