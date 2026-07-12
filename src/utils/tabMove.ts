// Pure segment-building helpers for tab drag-and-drop moves.
//
// Extracted from WindowGroupList.tsx where the exact same segment-building loop
// existed twice — once in the same-window path and once in the cross-window
// path. This module contains only pure functions (no chrome API calls); the
// component still owns chrome.tabs.move() / chrome.tabGroups.move() execution.

/**
 * A single move step. A `group` segment must be moved via
 * `chrome.tabGroups.move()` so Chrome preserves the group's title, color, and
 * membership. An `ungrouped` segment is a run of tabs moved via
 * `chrome.tabs.move()`.
 */
export type MoveSegment =
  { type: 'group'; groupId: number; tabIds: number[] } | { type: 'ungrouped'; tabIds: number[] };

/**
 * Split an ordered list of tab IDs into consecutive move segments.
 *
 * Behavior (matches the previous inline implementation in WindowGroupList
 * exactly):
 *
 * - Tabs whose `groupId` is in `preservedGroupIds` (and not `-1` / `undefined`)
 *   become part of a `group` segment. Consecutive tabs belonging to the SAME
 *   preserved group are merged into one segment. A boundary between different
 *   preserved groups closes the current segment even if both are preserved.
 * - All other tabs (ungrouped, or grouped but not preserved) form `ungrouped`
 *   segments. Consecutive ungrouped tabs are merged.
 * - Tabs missing from `tabMap` are silently skipped, matching the previous
 *   `if (!tab) continue;` guard.
 *
 * The output preserves the input order of `tabIds`; no sorting is done here.
 */
export function buildMoveSegments(
  tabIds: number[],
  tabMap: Map<number, chrome.tabs.Tab>,
  preservedGroupIds: Set<number>
): MoveSegment[] {
  const segments: MoveSegment[] = [];
  let currentSeg: MoveSegment | null = null;

  for (const tabId of tabIds) {
    const tab = tabMap.get(tabId);
    if (!tab) continue;
    const gid = tab.groupId;
    const isPreserved = gid !== -1 && gid !== undefined && preservedGroupIds.has(gid);

    if (isPreserved) {
      if (currentSeg?.type === 'group' && currentSeg.groupId === gid) {
        currentSeg.tabIds.push(tabId);
      } else {
        if (currentSeg) segments.push(currentSeg);
        currentSeg = { type: 'group', groupId: gid, tabIds: [tabId] };
      }
    } else {
      if (currentSeg?.type === 'ungrouped') {
        currentSeg.tabIds.push(tabId);
      } else {
        if (currentSeg) segments.push(currentSeg);
        currentSeg = { type: 'ungrouped', tabIds: [tabId] };
      }
    }
  }
  if (currentSeg) segments.push(currentSeg);

  return segments;
}
