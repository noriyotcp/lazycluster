/**
 * Pure utility functions for WindowActions component logic
 */

/**
 * Count how many IDs from the first array are present in the second array
 */
export const countSelectedIds = (visibleTabIds: number[], selectedTabIds: number[]): number => {
  return visibleTabIds.filter(id => selectedTabIds.includes(id)).length;
};

/**
 * Determine if the bulk select checkbox should be checked
 * (all visible tabs are selected)
 */
export const shouldBulkSelectBeChecked = (visibleTabs: chrome.tabs.Tab[], selectedTabIds: number[]): boolean => {
  return visibleTabs.length > 0 && visibleTabs.every(tab => tab.id !== undefined && selectedTabIds.includes(tab.id));
};

/**
 * Filter tab IDs to only include those belonging to a specific window
 * @param tabIds - Array of tab IDs to filter
 * @param windowId - Target window ID
 * @param tabWindowMap - Map of tab ID to window ID
 */
export const filterTabIdsByWindow = (
  tabIds: number[],
  windowId: number,
  tabWindowMap: Map<number, number>
): number[] => {
  return tabIds.filter(tabId => tabWindowMap.get(tabId) === windowId);
};

/**
 * Determine if the Close Tabs button should be disabled
 */
export const shouldCloseTabsBeDisabled = (visibleTabIds: number[], selectedTabIds: number[]): boolean => {
  return countSelectedIds(visibleTabIds, selectedTabIds) === 0;
};
