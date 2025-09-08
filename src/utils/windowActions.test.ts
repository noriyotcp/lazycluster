import { describe, it, expect } from 'vitest';
import {
  countSelectedIds,
  shouldBulkSelectBeChecked,
  filterTabIdsByWindow,
  shouldCloseTabsBeDisabled,
} from './windowActions';

describe('windowActions utilities', () => {
  describe('countSelectedIds', () => {
    it('returns 0 when no IDs are selected', () => {
      const visibleTabIds = [1, 2];
      const selectedTabIds: number[] = [];

      expect(countSelectedIds(visibleTabIds, selectedTabIds)).toBe(0);
    });

    it('counts matching IDs correctly', () => {
      const visibleTabIds = [1, 2];
      const selectedTabIds = [1, 2, 3, 4]; // 3, 4 are not in visibleTabIds

      expect(countSelectedIds(visibleTabIds, selectedTabIds)).toBe(2);
    });

    it('handles empty visible IDs', () => {
      const visibleTabIds: number[] = [];
      const selectedTabIds = [1, 2, 3];

      expect(countSelectedIds(visibleTabIds, selectedTabIds)).toBe(0);
    });

    it('returns 0 when no IDs match', () => {
      const visibleTabIds = [1, 2];
      const selectedTabIds = [3, 4]; // No overlap

      expect(countSelectedIds(visibleTabIds, selectedTabIds)).toBe(0);
    });

    it('counts partial matches correctly', () => {
      const visibleTabIds = [1, 2, 3, 4, 5];
      const selectedTabIds = [2, 4, 6, 8]; // Only 2 and 4 match

      expect(countSelectedIds(visibleTabIds, selectedTabIds)).toBe(2);
    });
  });

  describe('shouldBulkSelectBeChecked', () => {
    it('returns false when no tabs exist', () => {
      const visibleTabs: chrome.tabs.Tab[] = [];
      const selectedTabIds: number[] = [];

      expect(shouldBulkSelectBeChecked(visibleTabs, selectedTabIds)).toBe(false);
    });

    it('returns true when all visible tabs are selected', () => {
      const visibleTabs = [{ id: 1, windowId: 1 } as chrome.tabs.Tab, { id: 2, windowId: 1 } as chrome.tabs.Tab];
      const selectedTabIds = [1, 2, 3]; // Including extra selections

      expect(shouldBulkSelectBeChecked(visibleTabs, selectedTabIds)).toBe(true);
    });

    it('returns false when only some visible tabs are selected', () => {
      const visibleTabs = [{ id: 1, windowId: 1 } as chrome.tabs.Tab, { id: 2, windowId: 1 } as chrome.tabs.Tab];
      const selectedTabIds = [1]; // Only one selected

      expect(shouldBulkSelectBeChecked(visibleTabs, selectedTabIds)).toBe(false);
    });

    it('returns false when no visible tabs are selected', () => {
      const visibleTabs = [{ id: 1, windowId: 1 } as chrome.tabs.Tab, { id: 2, windowId: 1 } as chrome.tabs.Tab];
      const selectedTabIds = [3, 4]; // Other window tabs

      expect(shouldBulkSelectBeChecked(visibleTabs, selectedTabIds)).toBe(false);
    });

    it('handles tabs with undefined IDs correctly', () => {
      const visibleTabs = [
        { id: 1, windowId: 1 } as chrome.tabs.Tab,
        { id: undefined, windowId: 1 } as chrome.tabs.Tab,
      ];
      const selectedTabIds = [1];

      // The function checks if ALL tabs (including undefined) pass the condition
      // Since undefined tab cannot be included in selectedTabIds, it returns false
      expect(shouldBulkSelectBeChecked(visibleTabs, selectedTabIds)).toBe(false);
    });

    it('returns false when selectable tabs are not all selected', () => {
      const visibleTabs = [
        { id: 1, windowId: 1 } as chrome.tabs.Tab,
        { id: undefined, windowId: 1 } as chrome.tabs.Tab,
        { id: 3, windowId: 1 } as chrome.tabs.Tab,
      ];
      const selectedTabIds = [1]; // Only one of two selectable tabs is selected

      expect(shouldBulkSelectBeChecked(visibleTabs, selectedTabIds)).toBe(false);
    });
  });

  describe('filterTabIdsByWindow', () => {
    it('filters tabs by window ID correctly', () => {
      const tabIds = [1, 2, 3, 4, 5];
      const windowId = 1;
      const tabWindowMap = new Map([
        [1, 1],
        [2, 1],
        [3, 2],
        [4, 2],
        [5, 1],
      ]);

      expect(filterTabIdsByWindow(tabIds, windowId, tabWindowMap)).toEqual([1, 2, 5]);
    });

    it('returns empty array when no tabs match window', () => {
      const tabIds = [1, 2, 3];
      const windowId = 3;
      const tabWindowMap = new Map([
        [1, 1],
        [2, 1],
        [3, 2],
      ]);

      expect(filterTabIdsByWindow(tabIds, windowId, tabWindowMap)).toEqual([]);
    });

    it('handles missing entries in map', () => {
      const tabIds = [1, 2, 3, 4];
      const windowId = 1;
      const tabWindowMap = new Map([
        [1, 1],
        [2, 1],
        // 3 and 4 are not in the map
      ]);

      expect(filterTabIdsByWindow(tabIds, windowId, tabWindowMap)).toEqual([1, 2]);
    });
  });

  describe('shouldCloseTabsBeDisabled', () => {
    it('returns true when no IDs are selected', () => {
      const visibleTabIds = [1, 2];
      const selectedTabIds: number[] = [];

      expect(shouldCloseTabsBeDisabled(visibleTabIds, selectedTabIds)).toBe(true);
    });

    it('returns false when IDs are selected', () => {
      const visibleTabIds = [1, 2];
      const selectedTabIds = [1, 2];

      expect(shouldCloseTabsBeDisabled(visibleTabIds, selectedTabIds)).toBe(false);
    });

    it('returns true when no matching IDs are selected', () => {
      const visibleTabIds = [1, 2];
      const selectedTabIds = [3, 4]; // No overlap

      expect(shouldCloseTabsBeDisabled(visibleTabIds, selectedTabIds)).toBe(true);
    });

    it('returns false when at least one ID matches', () => {
      const visibleTabIds = [1, 2];
      const selectedTabIds = [1, 3, 4]; // Only 1 matches

      expect(shouldCloseTabsBeDisabled(visibleTabIds, selectedTabIds)).toBe(false);
    });
  });
});
