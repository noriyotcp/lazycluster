/**
 * Sync selected tab IDs with existing tabs, removing any non-existent tabs from selection
 * @param selectedTabIds Currently selected tab IDs
 * @param existingTabIds IDs of tabs that actually exist
 * @returns Filtered array containing only selected tabs that exist
 */
export function syncSelectedTabsWithExisting(selectedTabIds: number[], existingTabIds: number[]): number[] {
  const existingTabIdSet = new Set(existingTabIds);
  return selectedTabIds.filter(tabId => existingTabIdSet.has(tabId));
}

/**
 * Add a single tab to selection if not already selected
 * @param selectedTabIds Currently selected tab IDs
 * @param tabId Tab ID to add
 * @returns Updated selection array
 */
export function addTabToSelection(selectedTabIds: number[], tabId: number): number[] {
  if (selectedTabIds.includes(tabId)) {
    return selectedTabIds;
  }
  return [...selectedTabIds, tabId];
}

/**
 * Remove a single tab from selection
 * @param selectedTabIds Currently selected tab IDs
 * @param tabId Tab ID to remove
 * @returns Updated selection array
 */
export function removeTabFromSelection(selectedTabIds: number[], tabId: number): number[] {
  return selectedTabIds.filter(id => id !== tabId);
}

/**
 * Add multiple tabs to selection, avoiding duplicates
 * @param selectedTabIds Currently selected tab IDs
 * @param tabIds Tab IDs to add
 * @returns Updated selection array with unique IDs
 */
export function addTabsToSelectionUnique(selectedTabIds: number[], tabIds: number[]): number[] {
  return [...new Set([...selectedTabIds, ...tabIds])];
}

/**
 * Remove multiple tabs from selection
 * @param selectedTabIds Currently selected tab IDs
 * @param tabIds Tab IDs to remove
 * @returns Updated selection array
 */
export function removeTabsFromSelection(selectedTabIds: number[], tabIds: number[]): number[] {
  const tabIdsToRemove = new Set(tabIds);
  return selectedTabIds.filter(id => !tabIdsToRemove.has(id));
}

/**
 * Clear all selections
 * @returns Empty array
 */
export function clearSelection(): number[] {
  return [];
}
