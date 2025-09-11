export interface DeletionAnalysis {
  windowId: number;
  selectedTabIds: number[];
  totalTabsInWindow: number;
  isFullWindowSelection: boolean;
}

/**
 * Analyze which tabs are being deleted and group them by window
 * Determines if entire windows are being deleted or just individual tabs
 */
export function analyzeTabDeletion(
  selectedTabIds: number[],
  allTabs: chrome.tabs.Tab[]
): DeletionAnalysis[] {
  // Group tabs by window
  const windowMap = new Map<number, chrome.tabs.Tab[]>();
  
  allTabs.forEach(tab => {
    if (tab.windowId !== undefined) {
      const tabs = windowMap.get(tab.windowId) || [];
      tabs.push(tab);
      windowMap.set(tab.windowId, tabs);
    }
  });

  // Create Set for fast lookup
  const selectedSet = new Set(selectedTabIds);

  // Analyze each window
  const results: DeletionAnalysis[] = [];
  
  windowMap.forEach((windowTabs, windowId) => {
    const selectedInWindow = windowTabs
      .filter(tab => tab.id !== undefined && selectedSet.has(tab.id))
      .map(tab => tab.id!);

    if (selectedInWindow.length > 0) {
      results.push({
        windowId,
        selectedTabIds: selectedInWindow,
        totalTabsInWindow: windowTabs.length,
        isFullWindowSelection: selectedInWindow.length === windowTabs.length,
      });
    }
  });

  return results;
}

/**
 * Check if a single tab deletion would close the entire window
 */
export function isLastTabInWindow(
  tabId: number,
  windowTabs: chrome.tabs.Tab[]
): boolean {
  const tabsInWindow = windowTabs.filter(tab => tab.id !== undefined);
  return tabsInWindow.length === 1 && tabsInWindow[0].id === tabId;
}

/**
 * Group tab IDs by their window ID
 */
export function groupTabIdsByWindow(
  tabIds: number[],
  allTabs: chrome.tabs.Tab[]
): Map<number, number[]> {
  const windowToTabs = new Map<number, number[]>();
  const tabIdSet = new Set(tabIds);

  allTabs.forEach(tab => {
    if (tab.id !== undefined && tab.windowId !== undefined && tabIdSet.has(tab.id)) {
      const tabs = windowToTabs.get(tab.windowId) || [];
      tabs.push(tab.id);
      windowToTabs.set(tab.windowId, tabs);
    }
  });

  return windowToTabs;
}