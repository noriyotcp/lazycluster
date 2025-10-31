import { test, expect } from './fixtures';
import type { Page, Locator } from '@playwright/test';

// Helper function to create additional tabs for testing
async function createTabs(page: Page, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await page.evaluate(() => {
      return new Promise<void>(resolve => {
        chrome.tabs.create({ url: 'https://example.com', active: false }, () => resolve());
      });
    });
  }
  // Wait for tabs to be created
  await page.waitForTimeout(500);
}

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

// Helper function to perform drag-and-drop using pointer events
// Note: Keyboard drag doesn't support multi-item selection in dnd-kit
async function performDrag(page: Page, source: Locator, target: Locator): Promise<void> {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error('Could not get bounding boxes for drag operation');
  }

  // Calculate centers
  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + targetBox.height / 2;

  // Perform drag: mouse down, move, mouse up
  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();
  await page.waitForTimeout(100); // Wait for drag to activate
  await page.mouse.move(targetX, targetY, { steps: 10 }); // Smooth movement
  await page.waitForTimeout(100);
  await page.mouse.up();
}

test.describe('Multi-Drag E2E Tests', () => {
  test('should drag single tab to new position', async ({ page, extensionId }) => {
    // Open the manager tab
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for tabs to load
    await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });

    // Create additional tabs if needed (need at least 3 tabs total)
    const initialCount = await page.locator('.group\\/tabitem').count();
    if (initialCount < 3) {
      await createTabs(page, 3 - initialCount);
      // Reload to see new tabs
      await page.reload();
      await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });
    }

    // Get tab titles before drag
    const tabTitles = await page.locator('.group\\/tabitem a.list-col-grow').allTextContents();

    // Ensure we have at least 3 tabs for meaningful test
    expect(tabTitles.length).toBeGreaterThanOrEqual(3);

    // Get first and third tab's drag handles
    const firstDragHandle = page.locator('button[aria-label="Drag to reorder"]').first();
    const thirdTabItem = page.locator('.group\\/tabitem').nth(2);

    // Use mouse drag to move the first tab to the third position
    await performDrag(page, firstDragHandle, thirdTabItem);

    // Wait for Chrome API to update
    await page.waitForTimeout(500);

    // Get tab titles after drag
    const newTabTitles = await page.locator('.group\\/tabitem a.list-col-grow').allTextContents();

    // Verify first tab moved (title at index 0 should be different)
    expect(newTabTitles[0]).not.toBe(tabTitles[0]);

    // Verify the originally first tab is now at a different position
    expect(newTabTitles).toContain(tabTitles[0]);
  });

  test('should drag multiple selected tabs together and preserve order', async ({ page, extensionId }) => {
    // Open the manager tab
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for tabs to load
    await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });

    // Create additional tabs if needed (need at least 5 tabs total)
    const initialCount = await page.locator('.group\\/tabitem').count();
    if (initialCount < 5) {
      await createTabs(page, 5 - initialCount);
      await page.reload();
      await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });
    }

    // Get tab titles before drag
    const tabTitles = await page.locator('.group\\/tabitem a.list-col-grow').allTextContents();

    // Ensure we have at least 5 tabs for meaningful test
    expect(tabTitles.length).toBeGreaterThanOrEqual(5);

    // Select tabs 0, 1, 2 using Cmd/Ctrl+click
    const firstDragHandle = page.locator('button[aria-label="Drag to reorder"]').first();
    const secondDragHandle = page.locator('button[aria-label="Drag to reorder"]').nth(1);
    const thirdDragHandle = page.locator('button[aria-label="Drag to reorder"]').nth(2);

    await cmdClick(page, firstDragHandle);
    await cmdClick(page, secondDragHandle);
    await cmdClick(page, thirdDragHandle);

    // Verify all three tabs have drag selection background
    for (let i = 0; i <= 2; i++) {
      const tabItem = page.locator('.group\\/tabitem').nth(i);
      await expect(tabItem).toHaveClass(/bg-accent\/10/);
    }

    // Drag first selected tab (all three should move together)
    // Use mouse drag since keyboard drag doesn't support multi-item selection
    const fifthTabItem = page.locator('.group\\/tabitem').nth(4);
    await performDrag(page, firstDragHandle, fifthTabItem);

    // Wait for Chrome API to update
    await page.waitForTimeout(500);

    // Get tab titles after drag
    const newTabTitles = await page.locator('.group\\/tabitem a.list-col-grow').allTextContents();

    // Verify the three tabs moved together and preserved their order
    // Find where the first tab ended up
    const newIndex = newTabTitles.indexOf(tabTitles[0]);
    expect(newIndex).toBeGreaterThan(0); // Should have moved down

    // Verify the next two tabs are still in order after it
    expect(newTabTitles[newIndex]).toBe(tabTitles[0]);
    expect(newTabTitles[newIndex + 1]).toBe(tabTitles[1]);
    expect(newTabTitles[newIndex + 2]).toBe(tabTitles[2]);
  });

  test('should show badge with count in DragOverlay when dragging multiple selected tabs', async ({
    page,
    extensionId,
  }) => {
    // Open the manager tab
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for tabs to load
    await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });

    // Create additional tabs if needed (need at least 3 tabs total)
    const initialCount = await page.locator('.group\\/tabitem').count();
    if (initialCount < 3) {
      await createTabs(page, 3 - initialCount);
      await page.reload();
      await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });
    }

    // Select 3 tabs using Cmd/Ctrl+click
    const firstDragHandle = page.locator('button[aria-label="Drag to reorder"]').first();
    const secondDragHandle = page.locator('button[aria-label="Drag to reorder"]').nth(1);
    const thirdDragHandle = page.locator('button[aria-label="Drag to reorder"]').nth(2);

    await cmdClick(page, firstDragHandle);
    await cmdClick(page, secondDragHandle);
    await cmdClick(page, thirdDragHandle);

    // Start dragging the first selected tab to trigger DragOverlay
    const handleBox = await firstDragHandle.boundingBox();
    if (!handleBox) throw new Error('Could not get drag handle bounding box');

    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.waitForTimeout(100); // Wait for drag to activate
    // Move mouse slightly to trigger DragOverlay
    await page.mouse.move(startX + 10, startY + 10);
    await page.waitForTimeout(100);

    // Verify badge is visible with correct count
    const badge = page.locator('.badge-accent');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('3');

    // Complete the drag
    await page.mouse.up();
  });

  test('should move multiple selected tabs upward correctly', async ({ page, extensionId }) => {
    // Open the manager tab
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for tabs to load
    await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });

    // Create additional tabs if needed (need at least 5 tabs total)
    const initialCount = await page.locator('.group\\/tabitem').count();
    if (initialCount < 5) {
      await createTabs(page, 5 - initialCount);
      await page.reload();
      await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });
    }

    // Get tab titles before drag
    const tabTitles = await page.locator('.group\\/tabitem a.list-col-grow').allTextContents();

    // Ensure we have at least 5 tabs
    expect(tabTitles.length).toBeGreaterThanOrEqual(5);

    // Select tabs 3 and 4 using Cmd/Ctrl+click
    const fourthDragHandle = page.locator('button[aria-label="Drag to reorder"]').nth(3);
    const fifthDragHandle = page.locator('button[aria-label="Drag to reorder"]').nth(4);

    await cmdClick(page, fourthDragHandle);
    await cmdClick(page, fifthDragHandle);

    // Verify selection
    const fourthTabItem = page.locator('.group\\/tabitem').nth(3);
    const fifthTabItem = page.locator('.group\\/tabitem').nth(4);
    await expect(fourthTabItem).toHaveClass(/bg-accent\/10/);
    await expect(fifthTabItem).toHaveClass(/bg-accent\/10/);

    // Drag to second position (upward movement)
    const secondTabItem = page.locator('.group\\/tabitem').nth(1);
    await performDrag(page, fourthDragHandle, secondTabItem);

    // Wait for Chrome API to update
    await page.waitForTimeout(500);

    // Get tab titles after drag
    const newTabTitles = await page.locator('.group\\/tabitem a.list-col-grow').allTextContents();

    // Verify the two tabs moved upward together and preserved their order
    // Original tabs at index 3,4 should now be at index 1,2
    expect(newTabTitles[1]).toBe(tabTitles[3]);
    expect(newTabTitles[2]).toBe(tabTitles[4]);
  });

  test('should move multiple selected tabs downward correctly', async ({ page, extensionId }) => {
    // Open the manager tab
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for tabs to load
    await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });

    // Create additional tabs if needed (need at least 5 tabs total)
    const initialCount = await page.locator('.group\\/tabitem').count();
    if (initialCount < 5) {
      await createTabs(page, 5 - initialCount);
      await page.reload();
      await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });
    }

    // Get tab titles before drag
    const tabTitles = await page.locator('.group\\/tabitem a.list-col-grow').allTextContents();

    // Ensure we have at least 5 tabs
    expect(tabTitles.length).toBeGreaterThanOrEqual(5);

    // Select tabs 0 and 1 using Cmd/Ctrl+click
    const firstDragHandle = page.locator('button[aria-label="Drag to reorder"]').first();
    const secondDragHandle = page.locator('button[aria-label="Drag to reorder"]').nth(1);

    await cmdClick(page, firstDragHandle);
    await cmdClick(page, secondDragHandle);

    // Verify selection
    const firstTabItem = page.locator('.group\\/tabitem').first();
    const secondTabItem = page.locator('.group\\/tabitem').nth(1);
    await expect(firstTabItem).toHaveClass(/bg-accent\/10/);
    await expect(secondTabItem).toHaveClass(/bg-accent\/10/);

    // Drag to fourth position (downward movement)
    const fourthTabItem = page.locator('.group\\/tabitem').nth(3);
    await performDrag(page, firstDragHandle, fourthTabItem);

    // Wait for Chrome API to update
    await page.waitForTimeout(500);

    // Get tab titles after drag
    const newTabTitles = await page.locator('.group\\/tabitem a.list-col-grow').allTextContents();

    // Verify the two tabs moved downward together and preserved their order
    // Original tabs at index 0,1 should now be at index 2,3
    expect(newTabTitles[2]).toBe(tabTitles[0]);
    expect(newTabTitles[3]).toBe(tabTitles[1]);
  });

  test('should handle range selection (Shift+click) and drag correctly', async ({ page, extensionId }) => {
    // Open the manager tab
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Wait for tabs to load
    await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });

    // Create additional tabs if needed (need at least 6 tabs total)
    const initialCount = await page.locator('.group\\/tabitem').count();
    if (initialCount < 6) {
      await createTabs(page, 6 - initialCount);
      await page.reload();
      await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });
    }

    // Get tab titles before drag
    const tabTitles = await page.locator('.group\\/tabitem a.list-col-grow').allTextContents();

    // Ensure we have at least 6 tabs
    expect(tabTitles.length).toBeGreaterThanOrEqual(6);

    // Select tabs 1-3 using Shift+click (range selection)
    const secondDragHandle = page.locator('button[aria-label="Drag to reorder"]').nth(1);
    const fourthDragHandle = page.locator('button[aria-label="Drag to reorder"]').nth(3);

    // First Shift+click
    await shiftClick(page, secondDragHandle);

    // Second Shift+click to create range
    await shiftClick(page, fourthDragHandle);

    // Verify range selection (tabs 1, 2, 3)
    for (let i = 1; i <= 3; i++) {
      const tabItem = page.locator('.group\\/tabitem').nth(i);
      await expect(tabItem).toHaveClass(/bg-accent\/10/);
    }

    // Drag range to last position
    const lastIndex = tabTitles.length - 1;
    const lastTabItem = page.locator('.group\\/tabitem').nth(lastIndex);

    await performDrag(page, secondDragHandle, lastTabItem);

    // Wait for Chrome API to update
    await page.waitForTimeout(500);

    // Get tab titles after drag
    const newTabTitles = await page.locator('.group\\/tabitem a.list-col-grow').allTextContents();

    // Verify the range moved together and preserved order
    // Original tabs at index 1,2,3 should now be near the end
    const newIndex = newTabTitles.indexOf(tabTitles[1]);
    expect(newIndex).toBeGreaterThan(1); // Should have moved down

    // Verify order preserved
    expect(newTabTitles[newIndex]).toBe(tabTitles[1]);
    expect(newTabTitles[newIndex + 1]).toBe(tabTitles[2]);
    expect(newTabTitles[newIndex + 2]).toBe(tabTitles[3]);
  });
});
