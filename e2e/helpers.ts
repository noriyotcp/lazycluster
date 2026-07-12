import type { Page, Locator } from '@playwright/test';
import { expect } from './fixtures';

// Shared E2E helpers. See .claude/rules/e2e-testing.md for the conventions
// these implement (native event dispatch for modifier clicks, page.mouse for
// dnd-kit drags, delta assertions for tab counts).

/** Navigate to the manager page and wait for the first window group to render. */
export async function gotoManager(page: Page, extensionId: string): Promise<void> {
  await page.goto(`chrome-extension://${extensionId}/manager.html`);
  await page.locator('[data-window-group-number]').first().waitFor({ state: 'visible' });
}

/**
 * Click with Cmd (mac) / Ctrl (others) held, via native event dispatch —
 * Playwright's click({ modifiers }) does not reliably trigger React handlers.
 * Callers should follow with an assertion on the resulting state; React's
 * state update is not awaited here.
 */
export async function cmdClick(page: Page, locator: Locator): Promise<void> {
  const isMac = process.platform === 'darwin';
  await locator.evaluate((el: HTMLElement, mac: boolean) => {
    el.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, view: window, metaKey: mac, ctrlKey: !mac })
    );
  }, isMac);
}

/** Shift-click via native event dispatch. See cmdClick for why. */
export async function shiftClick(page: Page, locator: Locator): Promise<void> {
  await locator.evaluate((el: HTMLElement) => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, shiftKey: true }));
  });
}

/**
 * Create `count` tabs via the chrome.tabs API. Each chrome.tabs.create call is
 * awaited, but tab creation is async on the extension side (background debounces
 * UPDATE_TABS by 50ms) — callers must assert on the resulting UI state
 * (e.g. expect(locator).toHaveCount(before + count)) rather than assume this
 * resolving means the manager page has re-rendered.
 */
export async function createTabs(page: Page, count: number, url = 'https://example.com'): Promise<void> {
  for (let i = 0; i < count; i++) {
    await page.evaluate(
      target =>
        new Promise<void>(resolve => {
          chrome.tabs.create({ url: target, active: false }, () => resolve());
        }),
      url
    );
  }
}

/** Create a window via the chrome.windows API and return its id. Caller asserts on the resulting UI state. */
export async function createWindow(page: Page, url = 'https://example.com'): Promise<number> {
  const windowId = await page.evaluate(
    target =>
      new Promise<number>(resolve => {
        chrome.windows.create({ url: target, focused: false }, win => resolve(win!.id!));
      }),
    url
  );
  return windowId;
}

/** Remove a window via the chrome.windows API. Pure cleanup — nothing reads the DOM afterward. */
export async function removeWindow(page: Page, windowId: number): Promise<void> {
  await page.evaluate(
    id =>
      new Promise<void>(resolve => {
        chrome.windows.remove(id, () => resolve());
      }),
    windowId
  );
}

/**
 * Resolve the ancestor tab item `<li class="...group/tabitem...">` for a
 * locator inside it (typically the drag handle button). Selection/drag-state
 * styling (isDragging -> opacity, drag-selected -> bg-accent/10) is applied to
 * this `<li>`, not to the handle button itself — asserting on `handle`
 * directly will never see those styles change.
 */
export function tabItemOf(handle: Locator): Locator {
  return handle
    .locator('xpath=ancestor-or-self::*[contains(concat(" ", normalize-space(@class), " "), " group/tabitem ")]')
    .first();
}

/**
 * Press the mouse down on `source`, move it to (targetX, targetY), and return
 * once dnd-kit has actually activated the drag — observable via the tab
 * item's isDragging -> opacity: 0.5 style (see tabItemOf).
 *
 * dnd-kit's PointerSensor has an 8px activation distance, so isDragging only
 * flips true once the pointer has actually MOVED past that threshold —
 * mouse.down() alone never activates it, however long you wait afterward.
 * The move() call below crosses that threshold (targets are always well over
 * 8px away), so the activation assertion is placed after it, not before.
 *
 * Does NOT release the mouse or wait for any drop-target visual state (ring
 * highlight, drop indicator): those vary per test and should be asserted by
 * the caller before the next mouse action.
 */
export async function startDrag(page: Page, source: Locator, targetX: number, targetY: number): Promise<void> {
  const box = await source.boundingBox();
  if (!box) throw new Error('startDrag: source has no bounding box');
  const tabItem = tabItemOf(source);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetX, targetY, { steps: 10 });
  await expect(tabItem).toHaveCSS('opacity', '0.5', { timeout: 2000 });
}

/** Full drag-and-drop to a target locator's center. Caller is responsible for any pre-drop assertions. */
export async function performDrag(page: Page, source: Locator, target: Locator, targetYRatio = 0.5): Promise<void> {
  const targetBox = await target.boundingBox();
  if (!targetBox) throw new Error('performDrag: target has no bounding box');
  await startDrag(page, source, targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height * targetYRatio);
  await page.mouse.up();
}

/** Full drag-and-drop to raw coordinates (e.g. another window's drop zone). */
export async function performDragAndDrop(page: Page, source: Locator, targetX: number, targetY: number): Promise<void> {
  await startDrag(page, source, targetX, targetY);
  await page.mouse.up();
}
