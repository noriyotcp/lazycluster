import { test, expect } from './fixtures';
import type { Page, Locator } from '@playwright/test';

// Helper function to create a new browser window with a tab
async function createWindow(page: Page): Promise<number> {
  const windowId = await page.evaluate(() => {
    return new Promise<number>(resolve => {
      chrome.windows.create(
        { url: 'https://example.com', type: 'normal' },
        window => {
          if (window && window.id) resolve(window.id);
        }
      );
    });
  });
  await page.waitForTimeout(500);
  return windowId;
}

// Helper to clean up a window
async function removeWindow(page: Page, windowId: number): Promise<void> {
  await page.evaluate(id => chrome.windows.remove(id), windowId);
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
  await page.waitForTimeout(100);
}

// Start a drag from a source element and hold at a target position without dropping
async function startDragAndHold(
  page: Page,
  source: Locator,
  targetX: number,
  targetY: number
): Promise<void> {
  const sourceBox = await source.boundingBox();
  if (!sourceBox) throw new Error('Could not get bounding box for drag source');

  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;

  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();
  await page.waitForTimeout(100); // Wait for drag activation (PointerSensor distance: 8)
  await page.mouse.move(targetX, targetY, { steps: 10 });
  await page.waitForTimeout(200); // Wait for pointermove handler and React state update
  // Mouse is still held down — caller should release with page.mouse.up()
}

// Perform a full drag-and-drop from source to target position
async function performDragAndDrop(
  page: Page,
  source: Locator,
  targetX: number,
  targetY: number
): Promise<void> {
  await startDragAndHold(page, source, targetX, targetY);
  await page.mouse.up();
  await page.waitForTimeout(1000); // Wait for Chrome API + background script UI update
}

// Create an extra tab in a specific window
async function createTabInWindow(page: Page, windowId?: number): Promise<void> {
  await page.evaluate((wId) => {
    return new Promise<void>(resolve => {
      const opts: chrome.tabs.CreateProperties = { url: 'https://example.com', active: false };
      if (wId) opts.windowId = wId;
      chrome.tabs.create(opts, () => resolve());
    });
  }, windowId ?? null);
  await page.waitForTimeout(500);
}

test.describe('Cross-Window DnD Tab Movement', () => {
  test('should move a tab to another window on cross-window drop', async ({
    page,
    extensionId,
  }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Create extra tabs so the source window has enough to drag
    await createTabInWindow(page);
    await createTabInWindow(page);

    const newWindowId = await createWindow(page);

    try {
      const windowGroups = page.locator('[data-window-id]');
      await expect(windowGroups).toHaveCount(2);

      const allGroups = await windowGroups.all();
      const sourceGroup = allGroups[0];
      const targetGroup = allGroups[1];

      // Remember window IDs for stable post-drop queries
      const sourceWinId = await sourceGroup.getAttribute('data-window-id');
      const targetWinId = await targetGroup.getAttribute('data-window-id');

      // Count initial tabs dynamically (don't hardcode — initial tab count varies by environment)
      const sourceHandles = sourceGroup.locator('button[aria-label="Drag to reorder"]');
      const targetHandles = targetGroup.locator('button[aria-label="Drag to reorder"]');
      const sourceCountBefore = await sourceHandles.count();
      const targetCountBefore = await targetHandles.count();

      // Drag the last tab from source to the target window's tab
      const lastSourceHandle = sourceHandles.last();
      const targetHandle = targetHandles.first();
      const targetBox = await targetHandle.boundingBox();
      if (!targetBox) throw new Error('Could not get target handle bounding box');

      await performDragAndDrop(
        page,
        lastSourceHandle,
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2
      );

      // Verify: source lost one tab, target gained one tab
      const srcGroup = page.locator(`[data-window-id="${sourceWinId}"]`);
      const tgtGroup = page.locator(`[data-window-id="${targetWinId}"]`);
      await expect(srcGroup.locator('button[aria-label="Drag to reorder"]')).toHaveCount(sourceCountBefore - 1);
      await expect(tgtGroup.locator('button[aria-label="Drag to reorder"]')).toHaveCount(targetCountBefore + 1);
    } finally {
      await removeWindow(page, newWindowId);
    }
  });

  test('should move a tab to a collapsed window group', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Create extra tabs so the source window has enough to drag
    await createTabInWindow(page);
    await createTabInWindow(page);

    const newWindowId = await createWindow(page);

    try {
      const windowGroups = page.locator('[data-window-id]');
      await expect(windowGroups).toHaveCount(2);

      const allGroups = await windowGroups.all();
      const sourceGroup = allGroups[0];
      const targetGroup = allGroups[1];

      const sourceWinId = await sourceGroup.getAttribute('data-window-id');
      const targetWinId = await targetGroup.getAttribute('data-window-id');

      // Collapse the target window group
      const collapseCheckbox = targetGroup.locator(`#window-group-collapse-${targetWinId}`);
      await collapseCheckbox.click();
      await page.waitForTimeout(100);
      await expect(collapseCheckbox).not.toBeChecked();

      // Count initial tabs dynamically
      const sourceCountBefore = await sourceGroup.locator('button[aria-label="Drag to reorder"]').count();

      // Drag the last tab from source to the collapsed target group header
      const lastSourceHandle = sourceGroup.locator('button[aria-label="Drag to reorder"]').last();
      const targetBox = await targetGroup.boundingBox();
      if (!targetBox) throw new Error('Could not get target group bounding box');

      await performDragAndDrop(
        page,
        lastSourceHandle,
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2
      );

      // Verify source lost a tab
      const srcGroup = page.locator(`[data-window-id="${sourceWinId}"]`);
      await expect(srcGroup.locator('button[aria-label="Drag to reorder"]')).toHaveCount(sourceCountBefore - 1);

      // Expand target to verify it gained the tab
      const tgtGroup = page.locator(`[data-window-id="${targetWinId}"]`);
      const tgtCheckbox = tgtGroup.locator(`#window-group-collapse-${targetWinId}`);
      await tgtCheckbox.click();
      await page.waitForTimeout(100);
      await expect(tgtGroup.locator('button[aria-label="Drag to reorder"]')).toHaveCount(2);
    } finally {
      await removeWindow(page, newWindowId);
    }
  });
});

test.describe('Cross-Window Multi-Tab DnD', () => {
  test('should move multiple selected tabs to another window', async ({
    page,
    extensionId,
  }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Create extra tabs in source window (need at least 4)
    await createTabInWindow(page);
    await createTabInWindow(page);
    await createTabInWindow(page);

    const newWindowId = await createWindow(page);

    try {
      const windowGroups = page.locator('[data-window-id]');
      await expect(windowGroups).toHaveCount(2);

      const allGroups = await windowGroups.all();
      const sourceGroup = allGroups[0];
      const targetGroup = allGroups[1];

      const sourceWinId = await sourceGroup.getAttribute('data-window-id');
      const targetWinId = await targetGroup.getAttribute('data-window-id');

      const sourceHandles = sourceGroup.locator('button[aria-label="Drag to reorder"]');
      const targetHandles = targetGroup.locator('button[aria-label="Drag to reorder"]');
      const sourceCountBefore = await sourceHandles.count();
      const targetCountBefore = await targetHandles.count();

      // Cmd+click to select last two tabs (avoid selecting manager.html tab)
      const lastHandle = sourceHandles.last();
      const secondLastHandle = sourceHandles.nth(sourceCountBefore - 2);
      await cmdClick(page, secondLastHandle);
      await cmdClick(page, lastHandle);

      // Drag last selected handle to target window's first tab
      const targetHandle = targetHandles.first();
      const targetBox = await targetHandle.boundingBox();
      if (!targetBox) throw new Error('Could not get target handle bounding box');

      await performDragAndDrop(
        page,
        lastHandle,
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2
      );

      // Verify: source lost 2 tabs, target gained 2 tabs
      const srcGroup = page.locator(`[data-window-id="${sourceWinId}"]`);
      const tgtGroup = page.locator(`[data-window-id="${targetWinId}"]`);
      await expect(srcGroup.locator('button[aria-label="Drag to reorder"]')).toHaveCount(sourceCountBefore - 2);
      await expect(tgtGroup.locator('button[aria-label="Drag to reorder"]')).toHaveCount(targetCountBefore + 2);
    } finally {
      await removeWindow(page, newWindowId);
    }
  });

  test('should move multiple selected tabs to a collapsed window group', async ({
    page,
    extensionId,
  }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    await createTabInWindow(page);
    await createTabInWindow(page);
    await createTabInWindow(page);

    const newWindowId = await createWindow(page);

    try {
      const windowGroups = page.locator('[data-window-id]');
      await expect(windowGroups).toHaveCount(2);

      const allGroups = await windowGroups.all();
      const sourceGroup = allGroups[0];
      const targetGroup = allGroups[1];

      const sourceWinId = await sourceGroup.getAttribute('data-window-id');
      const targetWinId = await targetGroup.getAttribute('data-window-id');

      // Collapse target window group
      const collapseCheckbox = targetGroup.locator(`#window-group-collapse-${targetWinId}`);
      await collapseCheckbox.click();
      await page.waitForTimeout(100);

      const sourceHandles = sourceGroup.locator('button[aria-label="Drag to reorder"]');
      const sourceCountBefore = await sourceHandles.count();

      // Select last two tabs (avoid selecting manager.html tab)
      await cmdClick(page, sourceHandles.nth(sourceCountBefore - 2));
      await cmdClick(page, sourceHandles.last());

      // Drag to collapsed target group
      const targetBox = await targetGroup.boundingBox();
      if (!targetBox) throw new Error('Could not get target group bounding box');

      await performDragAndDrop(
        page,
        sourceHandles.last(),
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2
      );

      // Source lost 2 tabs
      const srcGroup = page.locator(`[data-window-id="${sourceWinId}"]`);
      await expect(srcGroup.locator('button[aria-label="Drag to reorder"]')).toHaveCount(sourceCountBefore - 2);

      // Expand target and verify it gained 2 tabs
      const tgtGroup = page.locator(`[data-window-id="${targetWinId}"]`);
      const tgtCheckbox = tgtGroup.locator(`#window-group-collapse-${targetWinId}`);
      await tgtCheckbox.click();
      await page.waitForTimeout(100);
      await expect(tgtGroup.locator('button[aria-label="Drag to reorder"]')).toHaveCount(3); // 1 original + 2 moved
    } finally {
      await removeWindow(page, newWindowId);
    }
  });

  test('should show ring highlight and count badge during cross-window multi-drag', async ({
    page,
    extensionId,
  }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    await createTabInWindow(page);
    await createTabInWindow(page);

    const newWindowId = await createWindow(page);

    try {
      const windowGroups = page.locator('[data-window-id]');
      await expect(windowGroups).toHaveCount(2);

      const allGroups = await windowGroups.all();
      const sourceGroup = allGroups[0];
      const targetGroup = allGroups[1];

      const sourceHandles = sourceGroup.locator('button[aria-label="Drag to reorder"]');

      // Select last two tabs (avoid selecting manager.html tab)
      const handleCount = await sourceHandles.count();
      await cmdClick(page, sourceHandles.nth(handleCount - 2));
      await cmdClick(page, sourceHandles.last());

      // Start drag and hold over target window (do NOT release)
      const targetBox = await targetGroup.boundingBox();
      if (!targetBox) throw new Error('Could not get target group bounding box');

      await startDragAndHold(
        page,
        sourceHandles.last(),
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2
      );

      // Ring highlight should be visible on target
      await expect(targetGroup).toHaveClass(/ring-2/);

      // Badge should show count (not prohibition icon)
      const badge = page.locator('.badge-accent');
      await expect(badge).toBeVisible();
      await expect(badge).toHaveText('2');

      // No prohibition icon should exist
      const ghostBadge = page.locator('.badge-ghost');
      await expect(ghostBadge).toHaveCount(0);

      await page.mouse.up();
    } finally {
      await removeWindow(page, newWindowId);
    }
  });
});

test.describe('Cross-Window DnD Ring Highlight', () => {
  test('should show ring highlight when dragging over a different window group', async ({
    page,
    extensionId,
  }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    const newWindowId = await createWindow(page);

    try {
      // Wait for both window groups to appear
      const windowGroups = page.locator('[data-window-id]');
      await expect(windowGroups).toHaveCount(2);

      // Get the window group elements
      const allGroups = await windowGroups.all();
      const sourceGroup = allGroups[0];
      const targetGroup = allGroups[1];

      // Get drag handles in the source window group
      const sourceDragHandles = sourceGroup.locator('button[aria-label="Drag to reorder"]');
      const firstHandle = sourceDragHandles.first();

      // Get target group bounding box
      const targetBox = await targetGroup.boundingBox();
      if (!targetBox) throw new Error('Could not get target group bounding box');

      // Drag from source and hold over the target window group
      await startDragAndHold(
        page,
        firstHandle,
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2
      );

      // Assert: target window group should have ring highlight
      await expect(targetGroup).toHaveClass(/ring-2/);

      // Assert: source window group should NOT have ring highlight
      await expect(sourceGroup).not.toHaveClass(/ring-2/);

      // Release to end drag
      await page.mouse.up();
      await page.waitForTimeout(100);

      // Assert: ring should be gone after drag end
      await expect(targetGroup).not.toHaveClass(/ring-2/);
    } finally {
      await removeWindow(page, newWindowId);
    }
  });

  test('should NOT show ring highlight when dragging within the same window group', async ({
    page,
    extensionId,
  }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    // Create extra tabs in the current window for drag targets
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        return new Promise<void>(resolve => {
          chrome.tabs.create({ url: 'https://example.com', active: false }, () => resolve());
        });
      });
    }
    await page.waitForTimeout(500);

    const windowGroup = page.locator('[data-window-id]').first();
    const dragHandles = windowGroup.locator('button[aria-label="Drag to reorder"]');

    // Get first and last drag handle positions
    const firstHandle = dragHandles.first();
    const lastHandle = dragHandles.last();
    const lastBox = await lastHandle.boundingBox();
    if (!lastBox) throw new Error('Could not get last handle bounding box');

    // Drag first tab toward the last tab (same window)
    await startDragAndHold(
      page,
      firstHandle,
      lastBox.x + lastBox.width / 2,
      lastBox.y + lastBox.height / 2
    );

    // Assert: no window group should have ring highlight during same-window drag
    await expect(windowGroup).not.toHaveClass(/ring-2/);

    await page.mouse.up();
  });

  test('should remove ring highlight when drag is cancelled with Escape', async ({
    page,
    extensionId,
  }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    const newWindowId = await createWindow(page);

    try {
      const windowGroups = page.locator('[data-window-id]');
      await expect(windowGroups).toHaveCount(2);

      const allGroups = await windowGroups.all();
      const sourceGroup = allGroups[0];
      const targetGroup = allGroups[1];

      const sourceDragHandles = sourceGroup.locator('button[aria-label="Drag to reorder"]');
      const firstHandle = sourceDragHandles.first();

      const targetBox = await targetGroup.boundingBox();
      if (!targetBox) throw new Error('Could not get target group bounding box');

      // Drag from source and hold over target
      await startDragAndHold(
        page,
        firstHandle,
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2
      );

      // Ring should be visible
      await expect(targetGroup).toHaveClass(/ring-2/);

      // Cancel drag with Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);

      // Ring should be gone
      await expect(targetGroup).not.toHaveClass(/ring-2/);
    } finally {
      await removeWindow(page, newWindowId);
    }
  });

  test('should show ring highlight on collapsed window group', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);

    const newWindowId = await createWindow(page);

    try {
      const windowGroups = page.locator('[data-window-id]');
      await expect(windowGroups).toHaveCount(2);

      const allGroups = await windowGroups.all();
      const sourceGroup = allGroups[0];
      const targetGroup = allGroups[1];

      // Collapse the target window group by clicking its collapse checkbox
      // Use the specific collapse checkbox ID (not bulk-select or tab checkboxes)
      const targetWindowId = await targetGroup.getAttribute('data-window-id');
      const collapseCheckbox = targetGroup.locator(`#window-group-collapse-${targetWindowId}`);
      await collapseCheckbox.click();
      await page.waitForTimeout(100);

      // Verify it's collapsed (checkbox unchecked)
      await expect(collapseCheckbox).not.toBeChecked();

      // Get drag handle from source window
      const sourceDragHandles = sourceGroup.locator('button[aria-label="Drag to reorder"]');
      const firstHandle = sourceDragHandles.first();

      // Get collapsed target header area for drop target
      const targetBox = await targetGroup.boundingBox();
      if (!targetBox) throw new Error('Could not get collapsed target bounding box');

      // Drag from source and hold over collapsed target
      await startDragAndHold(
        page,
        firstHandle,
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2
      );

      // Ring should appear on collapsed window group
      await expect(targetGroup).toHaveClass(/ring-2/);

      await page.mouse.up();
      await page.waitForTimeout(100);

      // Ring should be gone
      await expect(targetGroup).not.toHaveClass(/ring-2/);
    } finally {
      await removeWindow(page, newWindowId);
    }
  });
});
