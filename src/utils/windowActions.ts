/**
 * Pure utility functions for WindowActions component logic
 */

/**
 * Calculate the number of selected tabs in the current window
 */
export const calculateSelectedCountInWindow = (
  visibleTabs: chrome.tabs.Tab[],
  selectedTabIds: number[]
): number => {
  return visibleTabs.filter(
    tab => tab.id !== undefined && selectedTabIds.includes(tab.id)
  ).length;
};

/**
 * Determine if the bulk select checkbox should be checked
 * (all visible tabs are selected)
 */
export const shouldBulkSelectBeChecked = (
  visibleTabs: chrome.tabs.Tab[],
  selectedTabIds: number[]
): boolean => {
  return (
    visibleTabs.length > 0 &&
    visibleTabs.every(tab => tab.id !== undefined && selectedTabIds.includes(tab.id))
  );
};

/**
 * Extract valid tab IDs from an array of tabs
 */
export const extractTabIds = (tabs: chrome.tabs.Tab[]): number[] => {
  return tabs.map(tab => tab.id).filter((id): id is number => id !== undefined);
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
export const shouldCloseTabsBeDisabled = (
  visibleTabs: chrome.tabs.Tab[],
  selectedTabIds: number[]
): boolean => {
  return calculateSelectedCountInWindow(visibleTabs, selectedTabIds) === 0;
};