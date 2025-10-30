import { describe, it, expect } from 'vitest';
import {
  addTabToDragSelection,
  removeTabFromDragSelection,
  clearDragSelection,
  addTabsToDragSelection,
  getTabIdsInRangeForWindow,
} from './dragSelection';

describe('dragSelection utilities', () => {
  describe('addTabToDragSelection', () => {
    it('adds first tab to empty selection', () => {
      const result = addTabToDragSelection(new Set(), null, 1, 100);

      expect(result.selectedIds).toEqual(new Set([1]));
      expect(result.windowId).toBe(100);
    });

    it('adds tab to existing selection in same window', () => {
      const result = addTabToDragSelection(new Set([1, 2]), 100, 3, 100);

      expect(result.selectedIds).toEqual(new Set([1, 2, 3]));
      expect(result.windowId).toBe(100);
    });

    it('clears selection when switching to different window', () => {
      const result = addTabToDragSelection(new Set([1, 2, 3]), 100, 5, 200);

      expect(result.selectedIds).toEqual(new Set([5]));
      expect(result.windowId).toBe(200);
    });

    it('does not add duplicate tab', () => {
      const result = addTabToDragSelection(new Set([1, 2]), 100, 2, 100);

      expect(result.selectedIds).toEqual(new Set([1, 2]));
      expect(result.windowId).toBe(100);
    });

    it('handles null currentWindowId (first selection)', () => {
      const result = addTabToDragSelection(new Set(), null, 5, 100);

      expect(result.selectedIds).toEqual(new Set([5]));
      expect(result.windowId).toBe(100);
    });
  });

  describe('removeTabFromDragSelection', () => {
    it('removes existing tab from selection', () => {
      const result = removeTabFromDragSelection(new Set([1, 2, 3]), 2);

      expect(result).toEqual(new Set([1, 3]));
    });

    it('handles removing non-existent tab', () => {
      const result = removeTabFromDragSelection(new Set([1, 2]), 5);

      expect(result).toEqual(new Set([1, 2]));
    });

    it('handles empty selection', () => {
      const result = removeTabFromDragSelection(new Set(), 1);

      expect(result).toEqual(new Set());
    });

    it('removes last tab leaving empty set', () => {
      const result = removeTabFromDragSelection(new Set([1]), 1);

      expect(result).toEqual(new Set());
    });
  });

  describe('clearDragSelection', () => {
    it('returns empty Set', () => {
      const result = clearDragSelection();

      expect(result).toEqual(new Set());
    });
  });

  describe('addTabsToDragSelection', () => {
    it('adds multiple tabs to empty selection', () => {
      const result = addTabsToDragSelection(new Set(), null, [1, 2, 3], 100);

      expect(result.selectedIds).toEqual(new Set([1, 2, 3]));
      expect(result.windowId).toBe(100);
    });

    it('adds multiple tabs to existing selection in same window', () => {
      const result = addTabsToDragSelection(new Set([1, 2]), 100, [3, 4], 100);

      expect(result.selectedIds).toEqual(new Set([1, 2, 3, 4]));
      expect(result.windowId).toBe(100);
    });

    it('replaces selection when switching to different window', () => {
      const result = addTabsToDragSelection(new Set([1, 2, 3]), 100, [5, 6], 200);

      expect(result.selectedIds).toEqual(new Set([5, 6]));
      expect(result.windowId).toBe(200);
    });

    it('handles empty array', () => {
      const result = addTabsToDragSelection(new Set([1, 2]), 100, [], 100);

      expect(result.selectedIds).toEqual(new Set([1, 2]));
      expect(result.windowId).toBe(100);
    });

    it('handles duplicate IDs in input array', () => {
      const result = addTabsToDragSelection(new Set([1]), 100, [2, 2, 3], 100);

      expect(result.selectedIds).toEqual(new Set([1, 2, 3]));
      expect(result.windowId).toBe(100);
    });
  });

  describe('getTabIdsInRangeForWindow', () => {
    const createTab = (id: number, windowId: number): chrome.tabs.Tab => ({
      id,
      windowId,
      index: id - 1,
      pinned: false,
      highlighted: false,
      active: false,
      incognito: false,
      selected: false,
      discarded: false,
      autoDiscardable: true,
      groupId: -1,
      frozen: false,
    });

    it('returns tab IDs in range for same window', () => {
      const tabs = [createTab(1, 100), createTab(2, 100), createTab(3, 100), createTab(4, 100)];

      const result = getTabIdsInRangeForWindow(tabs, 1, 3, 100);

      expect(result).toEqual([2, 3, 4]);
    });

    it('filters out tabs from different windows', () => {
      const tabs = [
        createTab(1, 100),
        createTab(2, 100),
        createTab(3, 200), // Different window
        createTab(4, 100),
      ];

      const result = getTabIdsInRangeForWindow(tabs, 0, 3, 100);

      expect(result).toEqual([1, 2, 4]); // Tab 3 from window 200 is excluded
    });

    it('handles single tab range', () => {
      const tabs = [createTab(1, 100), createTab(2, 100), createTab(3, 100)];

      const result = getTabIdsInRangeForWindow(tabs, 1, 1, 100);

      expect(result).toEqual([2]);
    });

    it('handles full range', () => {
      const tabs = [createTab(1, 100), createTab(2, 100), createTab(3, 100)];

      const result = getTabIdsInRangeForWindow(tabs, 0, 2, 100);

      expect(result).toEqual([1, 2, 3]);
    });

    it('returns empty array when no tabs match window', () => {
      const tabs = [createTab(1, 200), createTab(2, 200), createTab(3, 200)];

      const result = getTabIdsInRangeForWindow(tabs, 0, 2, 100);

      expect(result).toEqual([]);
    });

    it('handles tabs without id (filters them out)', () => {
      const tabs = [
        { ...createTab(1, 100), id: undefined },
        createTab(2, 100),
        createTab(3, 100),
      ] as chrome.tabs.Tab[];

      const result = getTabIdsInRangeForWindow(tabs, 0, 2, 100);

      expect(result).toEqual([2, 3]);
    });

    it('handles empty tabs array', () => {
      const result = getTabIdsInRangeForWindow([], 0, 5, 100);

      expect(result).toEqual([]);
    });
  });

  describe('integration scenarios', () => {
    it('handles typical multi-select workflow within same window', () => {
      let selection = new Set<number>();
      let windowId: number | null = null;

      // First tab: Cmd+click tab #2 in window 100
      const result1 = addTabToDragSelection(selection, windowId, 2, 100);
      selection = result1.selectedIds;
      windowId = result1.windowId;
      expect(selection).toEqual(new Set([2]));

      // Second tab: Cmd+click tab #5 in same window
      const result2 = addTabToDragSelection(selection, windowId, 5, 100);
      selection = result2.selectedIds;
      windowId = result2.windowId;
      expect(selection).toEqual(new Set([2, 5]));

      // Third tab: Cmd+click tab #8 in same window
      const result3 = addTabToDragSelection(selection, windowId, 8, 100);
      selection = result3.selectedIds;
      windowId = result3.windowId;
      expect(selection).toEqual(new Set([2, 5, 8]));

      // Clear after drag
      selection = clearDragSelection();
      expect(selection).toEqual(new Set());
    });

    it('clears selection when switching windows', () => {
      let selection = new Set<number>();
      let windowId: number | null = null;

      // Select tabs in window 100
      const result1 = addTabsToDragSelection(selection, windowId, [1, 2, 3], 100);
      selection = result1.selectedIds;
      windowId = result1.windowId;
      expect(selection).toEqual(new Set([1, 2, 3]));

      // Cmd+click tab in window 200 - should clear previous selection
      const result2 = addTabToDragSelection(selection, windowId, 5, 200);
      selection = result2.selectedIds;
      windowId = result2.windowId;
      expect(selection).toEqual(new Set([5]));
      expect(windowId).toBe(200);
    });

    it('handles Shift+click range selection with window filtering', () => {
      const tabs: chrome.tabs.Tab[] = [
        { id: 1, windowId: 100, index: 0 } as chrome.tabs.Tab,
        { id: 2, windowId: 100, index: 1 } as chrome.tabs.Tab,
        { id: 3, windowId: 200, index: 2 } as chrome.tabs.Tab, // Different window
        { id: 4, windowId: 100, index: 3 } as chrome.tabs.Tab,
        { id: 5, windowId: 100, index: 4 } as chrome.tabs.Tab,
      ];

      // Cmd+click tab at index 1 (id: 2, window 100)
      let selection = new Set<number>();
      let windowId: number | null = null;
      const result1 = addTabToDragSelection(selection, windowId, 2, 100);
      selection = result1.selectedIds;
      windowId = result1.windowId;

      // Shift+click tab at index 4 (id: 5, window 100) - should select range excluding window 200
      const rangeIds = getTabIdsInRangeForWindow(tabs, 1, 4, 100);
      const result2 = addTabsToDragSelection(selection, windowId, rangeIds, 100);
      selection = result2.selectedIds;
      windowId = result2.windowId;

      // Should include: 2, 4, 5 (excluding 3 from window 200)
      expect(selection).toEqual(new Set([2, 4, 5]));
    });
  });
});
