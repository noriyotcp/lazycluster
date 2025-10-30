import { test, expect } from './fixtures';
import type { Page, Locator } from '@playwright/test';

// Helper function for Cmd/Ctrl+click using native event dispatch
async function cmdClick(page: Page, locator: Locator): Promise<void> {
  const isMac = process.platform === 'darwin';

  await locator.evaluate((element: HTMLElement, isMac: boolean) => {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      metaKey: isMac,
      ctrlKey: !isMac,
    });
    element.dispatchEvent(event);
  }, isMac);

  // Wait for React state update and DOM rendering
  await page.waitForTimeout(100);
}

// Helper function for Shift+click using native event dispatch
async function shiftClick(page: Page, locator: Locator): Promise<void> {
  await locator.evaluate((element: HTMLElement) => {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      shiftKey: true,
    });
    element.dispatchEvent(event);
  });

  // Wait for React state update and DOM rendering
  await page.waitForTimeout(100);
}

// Helper function to create additional tabs
async function createTabs(page: Page, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await page.evaluate(() => {
      return new Promise<void>(resolve => {
        chrome.tabs.create({ url: 'https://example.com', active: false }, () => resolve());
      });
    });
  }
  await page.waitForTimeout(500);
}

test.describe('Multi-Select E2E Tests', () => {
  test('should select and deselect tabs with Cmd+click on drag handle', async ({ page, extensionId }) => {
    // Open the manager tab
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for tabs to load
    await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });

    // Get first two drag handles
    const firstDragHandle = page.locator('button[aria-label="Drag to reorder"]').first();
    const secondDragHandle = page.locator('button[aria-label="Drag to reorder"]').nth(1);

    // Cmd+click first drag handle
    await cmdClick(page, firstDragHandle);

    // Verify first tab has drag selection background (bg-accent/10)
    const firstTabItem = page.locator('.group\\/tabitem').first();
    await expect(firstTabItem).toHaveClass(/bg-accent\/10/);

    // Cmd+click second drag handle
    await cmdClick(page, secondDragHandle);

    // Verify both tabs have drag selection background
    const secondTabItem = page.locator('.group\\/tabitem').nth(1);
    await expect(firstTabItem).toHaveClass(/bg-accent\/10/);
    await expect(secondTabItem).toHaveClass(/bg-accent\/10/);

    // Cmd+click first drag handle again to deselect
    await cmdClick(page, firstDragHandle);

    // Verify first tab no longer has drag selection background
    await expect(firstTabItem).not.toHaveClass(/bg-accent\/10/);

    // Verify second tab still has drag selection background
    await expect(secondTabItem).toHaveClass(/bg-accent\/10/);
  });

  test('should select range with Shift+click on drag handle', async ({ page, extensionId }) => {
    // Open the manager tab
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for tabs to load
    await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });

    // Ensure we have at least 5 tabs
    const initialCount = await page.locator('.group\\/tabitem').count();
    if (initialCount < 5) {
      await createTabs(page, 5 - initialCount);
      await page.reload();
      await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });
    }

    // Get drag handles
    const firstDragHandle = page.locator('button[aria-label="Drag to reorder"]').first();
    const fourthDragHandle = page.locator('button[aria-label="Drag to reorder"]').nth(3);

    // Shift+click first drag handle (should select only first tab)
    await shiftClick(page, firstDragHandle);

    // Verify first tab has drag selection background
    const firstTabItem = page.locator('.group\\/tabitem').first();
    await expect(firstTabItem).toHaveClass(/bg-accent\/10/);

    // Shift+click fourth drag handle (should select range: tabs 0-3)
    await shiftClick(page, fourthDragHandle);

    // Verify all tabs in range have drag selection background
    for (let i = 0; i <= 3; i++) {
      const tabItem = page.locator('.group\\/tabitem').nth(i);
      await expect(tabItem).toHaveClass(/bg-accent\/10/);
    }

    // Verify fifth tab does not have drag selection background
    const fifthTabItem = page.locator('.group\\/tabitem').nth(4);
    await expect(fifthTabItem).not.toHaveClass(/bg-accent\/10/);
  });

  test('should select range in reverse order with Shift+click', async ({ page, extensionId }) => {
    // Open the manager tab
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for tabs to load
    await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });

    // Ensure we have at least 6 tabs
    const initialCount = await page.locator('.group\\/tabitem').count();
    if (initialCount < 6) {
      await createTabs(page, 6 - initialCount);
      await page.reload();
      await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });
    }

    // Get drag handles
    const secondDragHandle = page.locator('button[aria-label="Drag to reorder"]').nth(1);
    const fifthDragHandle = page.locator('button[aria-label="Drag to reorder"]').nth(4);

    // Shift+click fifth drag handle first
    await shiftClick(page, fifthDragHandle);

    // Verify only fifth tab has drag selection background
    const fifthTabItem = page.locator('.group\\/tabitem').nth(4);
    await expect(fifthTabItem).toHaveClass(/bg-accent\/10/);

    // Shift+click second drag handle (should select range: tabs 1-4, reverse order)
    await shiftClick(page, secondDragHandle);

    // Verify all tabs in range have drag selection background
    for (let i = 1; i <= 4; i++) {
      const tabItem = page.locator('.group\\/tabitem').nth(i);
      await expect(tabItem).toHaveClass(/bg-accent\/10/);
    }

    // Verify first tab does not have drag selection background
    const firstTabItem = page.locator('.group\\/tabitem').first();
    await expect(firstTabItem).not.toHaveClass(/bg-accent\/10/);
  });

  test('should clear drag selection when clicking selected tab without modifiers', async ({ page, extensionId }) => {
    // Open the manager tab
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for tabs to load
    await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });

    // Get drag handles
    const firstDragHandle = page.locator('button[aria-label="Drag to reorder"]').first();
    const secondDragHandle = page.locator('button[aria-label="Drag to reorder"]').nth(1);

    // Select two tabs with Cmd/Ctrl+click
    await cmdClick(page, firstDragHandle);
    await cmdClick(page, secondDragHandle);

    // Verify both tabs have drag selection background
    const firstTabItem = page.locator('.group\\/tabitem').first();
    const secondTabItem = page.locator('.group\\/tabitem').nth(1);
    await expect(firstTabItem).toHaveClass(/bg-accent\/10/);
    await expect(secondTabItem).toHaveClass(/bg-accent\/10/);

    // Normal click (no modifiers) on first drag handle
    await firstDragHandle.click();

    // Verify both tabs no longer have drag selection background
    await expect(firstTabItem).not.toHaveClass(/bg-accent\/10/);
    await expect(secondTabItem).not.toHaveClass(/bg-accent\/10/);
  });

  test('should maintain drag selection independent of checkbox selection', async ({ page, extensionId }) => {
    // Open the manager tab
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for tabs to load
    await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });

    // Get first tab checkbox and drag handle
    const firstCheckbox = page.locator('input[id^="tab-"]').first();
    const secondDragHandle = page.locator('button[aria-label="Drag to reorder"]').nth(1);

    // Click checkbox to select for deletion
    await firstCheckbox.check();

    // Verify checkbox is checked
    await expect(firstCheckbox).toBeChecked();

    // Cmd/Ctrl+click drag handle to select for dragging (different tab)
    await cmdClick(page, secondDragHandle);

    // Verify second tab has drag selection background (bg-accent/10)
    const secondTabItem = page.locator('.group\\/tabitem').nth(1);
    await expect(secondTabItem).toHaveClass(/bg-accent\/10/);

    // Verify first tab does NOT have drag selection background (only checkbox checked)
    const firstTabItem = page.locator('.group\\/tabitem').first();
    await expect(firstTabItem).not.toHaveClass(/bg-accent\/10/);

    // Verify checkbox is still checked
    await expect(firstCheckbox).toBeChecked();
  });

  test('should only select tabs within same window for Shift+click range', async ({ page, extensionId }) => {
    // First, open the manager tab
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Create a new window
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

      // Reload to get updated window list
      await page.reload();

      // Wait for two window groups to appear
      await page.locator('[data-window-group-number]').nth(1).waitFor({ timeout: 5000 });

      // Ensure first window has at least 3 tabs
      const firstWindowGroup = page.locator('[data-window-group-number]').first();
      const firstWindowTabCount = await firstWindowGroup.locator('.group\\/tabitem').count();
      if (firstWindowTabCount < 3) {
        await createTabs(page, 3 - firstWindowTabCount);
        await page.reload();
        await page.locator('[data-window-group-number]').nth(1).waitFor({ timeout: 5000 });
      }
      const firstDragHandle = firstWindowGroup.locator('button[aria-label="Drag to reorder"]').first();
      const thirdDragHandle = firstWindowGroup.locator('button[aria-label="Drag to reorder"]').nth(2);

      // Shift+click first drag handle in first window
      await shiftClick(page, firstDragHandle);

      // Shift+click third drag handle in first window (should select range within same window)
      await shiftClick(page, thirdDragHandle);

      // Verify only tabs in first window have drag selection
      const firstWindowTabs = await firstWindowGroup.locator('.group\\/tabitem').count();

      // Check tabs 0-2 in first window have drag selection
      for (let i = 0; i <= 2 && i < firstWindowTabs; i++) {
        const tabItem = firstWindowGroup.locator('.group\\/tabitem').nth(i);
        await expect(tabItem).toHaveClass(/bg-accent\/10/);
      }

      // Verify second window group has no drag selections
      const secondWindowGroup = page.locator('[data-window-group-number]').nth(1);
      const secondWindowFirstTab = secondWindowGroup.locator('.group\\/tabitem').first();

      // Second window's tabs should not have drag selection background
      if (await secondWindowFirstTab.count() > 0) {
        await expect(secondWindowFirstTab).not.toHaveClass(/bg-accent\/10/);
      }
    } finally {
      // Cleanup: close the created window
      try {
        await page.evaluate((windowId: number) => {
          return new Promise<void>(resolve => {
            chrome.windows.remove(windowId, () => {
              setTimeout(resolve, 100);
            });
          });
        }, newWindowId);
      } catch (_e) {
        // Expected error, no action needed
      }
    }
  });

  test('should not interfere with existing keyboard navigation', async ({ page, extensionId }) => {
    // Open the manager tab
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for tabs to load
    const firstTabItem = page.locator('.group\\/tabitem').first();
    await firstTabItem.waitFor({ state: 'visible' });

    // Focus first tab item using Tab key
    await firstTabItem.focus();

    // Verify first tab is focused
    await expect(firstTabItem).toBeFocused();

    // Press Space key (should toggle checkbox, not activate drag)
    await page.keyboard.press(' ');

    // Verify checkbox was toggled
    const firstCheckbox = page.locator('input[id^="tab-"]').first();
    await expect(firstCheckbox).toBeChecked();

    // Press j key to navigate down
    await page.keyboard.press('j');

    // Verify focus moved to second tab
    const secondTabItem = page.locator('.group\\/tabitem').nth(1);
    await expect(secondTabItem).toBeFocused();

    // Press k key to navigate up
    await page.keyboard.press('k');

    // Verify focus moved back to first tab
    await expect(firstTabItem).toBeFocused();
  });
});
