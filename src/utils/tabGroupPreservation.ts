export interface TabGroupToPreserve {
  groupId: number;
  tabIds: number[];
}

/**
 * Identify which tab groups should be preserved when moving tabs cross-window.
 * A group is preserved only when ALL tabs in that group are being moved.
 * If only a subset is moved, those tabs become ungrouped (Chrome API default).
 *
 * @param tabsToMove - Tab IDs that will be moved to another window
 * @param sourceWindowTabs - All tabs in the source window (from chrome.windows.getAll)
 * @returns Groups where every member tab is being moved
 */
export function identifyGroupsToPreserve(
  tabsToMove: number[],
  sourceWindowTabs: chrome.tabs.Tab[]
): TabGroupToPreserve[] {
  const tabsToMoveSet = new Set(tabsToMove);

  // Aggregate per group: total count in window + which ones are being moved
  const groupStats = new Map<number, { total: number; movingTabIds: number[] }>();

  for (const tab of sourceWindowTabs) {
    const gid = tab.groupId;
    if (gid === undefined || gid === -1) continue; // skip ungrouped

    let stats = groupStats.get(gid);
    if (!stats) {
      stats = { total: 0, movingTabIds: [] };
      groupStats.set(gid, stats);
    }
    stats.total++;
    if (tab.id !== undefined && tabsToMoveSet.has(tab.id)) {
      stats.movingTabIds.push(tab.id);
    }
  }

  const result: TabGroupToPreserve[] = [];
  for (const [groupId, stats] of groupStats) {
    if (stats.movingTabIds.length === stats.total) {
      result.push({ groupId, tabIds: stats.movingTabIds });
    }
  }

  return result;
}
