import { describe, it, expect } from 'vitest';
import { identifyGroupsToPreserve } from './tabGroupPreservation';

// Helper to create a minimal chrome.tabs.Tab for testing
function makeTab(id: number, groupId: number): chrome.tabs.Tab {
  return {
    id,
    groupId,
    index: 0,
    pinned: false,
    highlighted: false,
    windowId: 1,
    active: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    frozen: false,
  };
}

describe('identifyGroupsToPreserve', () => {
  it('returns empty array when all tabs are ungrouped', () => {
    const tabs = [makeTab(1, -1), makeTab(2, -1), makeTab(3, -1)];
    const result = identifyGroupsToPreserve([1, 2], tabs);
    expect(result).toEqual([]);
  });

  it('returns the group when all tabs in the group are moved', () => {
    const tabs = [makeTab(1, 100), makeTab(2, 100), makeTab(3, -1)];
    const result = identifyGroupsToPreserve([1, 2], tabs);
    expect(result).toEqual([{ groupId: 100, tabIds: [1, 2] }]);
  });

  it('returns empty array when only some tabs in the group are moved', () => {
    const tabs = [makeTab(1, 100), makeTab(2, 100), makeTab(3, 100)];
    const result = identifyGroupsToPreserve([1, 2], tabs);
    expect(result).toEqual([]);
  });

  it('returns multiple groups when all tabs in each are moved', () => {
    const tabs = [
      makeTab(1, 100), makeTab(2, 100),
      makeTab(3, 200), makeTab(4, 200),
    ];
    const result = identifyGroupsToPreserve([1, 2, 3, 4], tabs);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ groupId: 100, tabIds: [1, 2] });
    expect(result).toContainEqual({ groupId: 200, tabIds: [3, 4] });
  });

  it('returns only the group where all tabs are moved (mixed case)', () => {
    const tabs = [
      makeTab(1, 100), makeTab(2, 100),
      makeTab(3, 200), makeTab(4, 200), makeTab(5, 200),
    ];
    // Moving all of group 100 but only part of group 200
    const result = identifyGroupsToPreserve([1, 2, 3], tabs);
    expect(result).toEqual([{ groupId: 100, tabIds: [1, 2] }]);
  });

  it('returns the group when it contains a single tab that is moved', () => {
    const tabs = [makeTab(1, 100), makeTab(2, -1)];
    const result = identifyGroupsToPreserve([1], tabs);
    expect(result).toEqual([{ groupId: 100, tabIds: [1] }]);
  });

  it('returns only grouped tabs (ignores ungrouped) in mixed set', () => {
    const tabs = [
      makeTab(1, 100), makeTab(2, 100),
      makeTab(3, -1), makeTab(4, -1),
    ];
    // Moving group 100 (all) + ungrouped tabs
    const result = identifyGroupsToPreserve([1, 2, 3], tabs);
    expect(result).toEqual([{ groupId: 100, tabIds: [1, 2] }]);
  });
});
