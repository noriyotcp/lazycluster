/**
 * Drag selection utility functions for multi-drag operations
 * These are pure functions that can be easily tested without React context
 */

/**
 * Add a single tab to drag selection
 * If switching to a different window, clears previous selection
 * @param dragSelectedTabIds Currently selected tab IDs for drag
 * @param currentWindowId Currently tracked window ID
 * @param tabId Tab ID to add
 * @param tabWindowId Window ID of the tab to add
 * @returns Updated selection Set and window ID
 */
export function addTabToDragSelection(
  dragSelectedTabIds: Set<number>,
  currentWindowId: number | null,
  tabId: number,
  tabWindowId: number
): { selectedIds: Set<number>; windowId: number } {
  // If switching to different window, clear previous selection
  if (currentWindowId !== null && currentWindowId !== tabWindowId) {
    return {
      selectedIds: new Set([tabId]),
      windowId: tabWindowId,
    };
  }

  // Add to existing selection
  const newSet = new Set(dragSelectedTabIds);
  newSet.add(tabId);
  return {
    selectedIds: newSet,
    windowId: tabWindowId,
  };
}

/**
 * Remove a single tab from drag selection
 * @param dragSelectedTabIds Currently selected tab IDs
 * @param tabId Tab ID to remove
 * @returns Updated selection Set
 */
export function removeTabFromDragSelection(dragSelectedTabIds: Set<number>, tabId: number): Set<number> {
  const newSet = new Set(dragSelectedTabIds);
  newSet.delete(tabId);
  return newSet;
}

/**
 * Clear all drag selection
 * @returns Empty Set
 */
export function clearDragSelection(): Set<number> {
  return new Set();
}

/**
 * Add multiple tabs to drag selection
 * If switching to a different window, replaces with new selection
 * @param dragSelectedTabIds Currently selected tab IDs
 * @param currentWindowId Currently tracked window ID
 * @param tabIds Tab IDs to add
 * @param tabWindowId Window ID of the tabs to add
 * @returns Updated selection Set and window ID
 */
export function addTabsToDragSelection(
  dragSelectedTabIds: Set<number>,
  currentWindowId: number | null,
  tabIds: number[],
  tabWindowId: number
): { selectedIds: Set<number>; windowId: number } {
  // If switching to different window, replace with new selection
  if (currentWindowId !== null && currentWindowId !== tabWindowId) {
    return {
      selectedIds: new Set(tabIds),
      windowId: tabWindowId,
    };
  }

  // Add to existing selection
  const newSet = new Set(dragSelectedTabIds);
  tabIds.forEach(id => newSet.add(id));
  return {
    selectedIds: newSet,
    windowId: tabWindowId,
  };
}

/**
 * Filter tabs by window ID for range selection
 * Used for Shift+click range selection within same window
 * @param tabs Array of tabs
 * @param startIndex Start index of range (inclusive)
 * @param endIndex End index of range (inclusive)
 * @param windowId Window ID to filter by
 * @returns Array of tab IDs within range that belong to the specified window
 */
export function getTabIdsInRangeForWindow(
  tabs: chrome.tabs.Tab[],
  startIndex: number,
  endIndex: number,
  windowId: number
): number[] {
  return tabs
    .slice(startIndex, endIndex + 1)
    .filter(tab => tab.windowId === windowId && tab.id !== undefined)
    .map(tab => tab.id!);
}
