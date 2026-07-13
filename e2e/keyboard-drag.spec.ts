import { test, expect } from './fixtures';
import { createTabs } from './helpers';

// Read tab ids in current-window order via Chrome API — resilient to
// duplicate titles/hrefs across pre-existing `about:blank` fixture tabs.
async function readTabIds(page: import('@playwright/test').Page): Promise<number[]> {
  return page.evaluate(async () => {
    const win = await chrome.windows.getCurrent();
    const tabs = await chrome.tabs.query({ windowId: win.id });
    return tabs.map(t => t.id!);
  });
}

// Y coordinate of the currently-visible drop indicator (the .bg-info element
// dnd-kit's over state makes opacity-100). Returns null when no drag is active.
async function dropIndicatorY(page: import('@playwright/test').Page): Promise<number | null> {
  return page.evaluate(() => {
    const el = document.querySelector('.opacity-100.bg-info');
    return el ? Math.round((el as HTMLElement).getBoundingClientRect().top) : null;
  });
}

test.describe('Keyboard Drag E2E Tests', () => {
  test('should reorder tab via keyboard drag (Enter → ArrowDown → Enter)', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);
    await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });

    const initialCount = await page.locator('.group\\/tabitem').count();
    if (initialCount < 3) {
      await createTabs(page, 3 - initialCount);
      await page.reload();
      await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });
    }

    const tabIdsBefore = await readTabIds(page);
    expect(tabIdsBefore.length).toBeGreaterThanOrEqual(3);
    const originalFirstId = tabIdsBefore[0];
    const firstItem = page.locator('.group\\/tabitem').first();

    const firstDragHandle = page.locator('button[aria-label="Drag to reorder"]').first();
    await firstDragHandle.focus();
    await page.keyboard.press('Enter'); // Start drag
    // Signal-based: wait for dnd-kit to mark the item active before firing arrow
    // keys, so the KeyboardSensor + sortableKeyboardCoordinates path has a
    // settled DragOverlay to measure against.
    await expect(firstItem).toHaveAttribute('aria-pressed', 'true');

    // The race: sortableKeyboardCoordinates needs the previous keydown fully
    // processed before the next arrives — polling AFTER a press cannot recover
    // a keydown that raced (nothing further fires), so we settle BEFORE each
    // next press. This is the documented waitForTimeout exception under
    // .claude/rules/e2e-testing.md.
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(30);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(30);
    await page.keyboard.press('Enter'); // Drop

    await expect.poll(async () => (await readTabIds(page))[0]).not.toBe(originalFirstId);

    const tabIdsAfter = await readTabIds(page);
    const newIndex = tabIdsAfter.indexOf(originalFirstId);
    expect(newIndex).toBeGreaterThan(0);
  });

  test('should cancel keyboard drag on Escape and keep original order', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/manager.html`);
    await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });

    const initialCount = await page.locator('.group\\/tabitem').count();
    if (initialCount < 3) {
      await createTabs(page, 3 - initialCount);
      await page.reload();
      await page.locator('.group\\/tabitem').first().waitFor({ state: 'visible' });
    }

    const tabIdsBefore = await readTabIds(page);
    expect(tabIdsBefore.length).toBeGreaterThanOrEqual(3);
    const firstItem = page.locator('.group\\/tabitem').first();

    const firstDragHandle = page.locator('button[aria-label="Drag to reorder"]').first();
    await firstDragHandle.focus();
    await page.keyboard.press('Enter'); // Start drag
    await expect(firstItem).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('ArrowDown'); // Move (preview only)
    await page.waitForTimeout(30);
    await page.keyboard.press('Escape'); // Cancel — should trigger onDragCancel

    // Positive control for the cancel path: without these, a broken onDragCancel
    // would still pass the "no reorder" assertion because ArrowDown alone never
    // calls chrome.tabs.move — a hung drag looks identical to a cancelled one
    // in tab-order terms. Instrumenting the hook at HEAD shows onDragCancel
    // does fire in practice, so this hardens rather than uncovers a bug.
    await expect(firstItem).not.toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => dropIndicatorY(page)).toBeNull();

    // Assert the pre-existing tab order is unchanged. Slice off any tabs
    // that appear during the poll window (test environment may spawn stray
    // tabs on some runs), which is orthogonal to whether Escape cancelled.
    await expect.poll(async () => (await readTabIds(page)).slice(0, tabIdsBefore.length)).toEqual(tabIdsBefore);
  });
});
