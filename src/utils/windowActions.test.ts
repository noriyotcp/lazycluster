import { describe, it, expect } from 'vitest';
import {
  calculateSelectedCountInWindow,
  shouldBulkSelectBeChecked,
  extractTabIds,
  filterTabIdsByWindow,
  shouldCloseTabsBeDisabled,
} from './windowActions';

describe('windowActions utilities', () => {
  describe('calculateSelectedCountInWindow', () => {
    it('returns 0 when no tabs are selected', () => {
      const visibleTabs = [{ id: 1, windowId: 1 } as chrome.tabs.Tab, { id: 2, windowId: 1 } as chrome.tabs.Tab];
      const selectedTabIds: number[] = [];

      expect(calculateSelectedCountInWindow(visibleTabs, selectedTabIds)).toBe(0);
    });

    it('counts only tabs from current window that are selected', () => {
      const visibleTabs = [{ id: 1, windowId: 1 } as chrome.tabs.Tab, { id: 2, windowId: 1 } as chrome.tabs.Tab];
      const selectedTabIds = [1, 2, 3, 4]; // 3, 4 are from other windows

      expect(calculateSelectedCountInWindow(visibleTabs, selectedTabIds)).toBe(2);
    });

    it('handles tabs with undefined IDs', () => {
      const visibleTabs = [
        { id: 1, windowId: 1 } as chrome.tabs.Tab,
        { id: undefined, windowId: 1 } as chrome.tabs.Tab,
        { id: 3, windowId: 1 } as chrome.tabs.Tab,
      ];
      const selectedTabIds = [1, 3];

      expect(calculateSelectedCountInWindow(visibleTabs, selectedTabIds)).toBe(2);
    });

    it('returns 0 when only other window tabs are selected', () => {
      // This test would have caught the original bug!
      const visibleTabs = [{ id: 1, windowId: 1 } as chrome.tabs.Tab, { id: 2, windowId: 1 } as chrome.tabs.Tab];
      const selectedTabIds = [3, 4]; // Only tabs from other windows

      expect(calculateSelectedCountInWindow(visibleTabs, selectedTabIds)).toBe(0);
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

  describe('extractTabIds', () => {
    it('extracts valid tab IDs', () => {
      const tabs = [
        { id: 1, windowId: 1 } as chrome.tabs.Tab,
        { id: 2, windowId: 1 } as chrome.tabs.Tab,
        { id: 3, windowId: 1 } as chrome.tabs.Tab,
      ];

      expect(extractTabIds(tabs)).toEqual([1, 2, 3]);
    });

    it('filters out undefined IDs', () => {
      const tabs = [
        { id: 1, windowId: 1 } as chrome.tabs.Tab,
        { id: undefined, windowId: 1 } as chrome.tabs.Tab,
        { id: 3, windowId: 1 } as chrome.tabs.Tab,
      ];

      expect(extractTabIds(tabs)).toEqual([1, 3]);
    });

    it('returns empty array for empty input', () => {
      expect(extractTabIds([])).toEqual([]);
    });

    it('returns empty array when all IDs are undefined', () => {
      const tabs = [
        { id: undefined, windowId: 1 } as chrome.tabs.Tab,
        { id: undefined, windowId: 1 } as chrome.tabs.Tab,
      ];

      expect(extractTabIds(tabs)).toEqual([]);
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
    it('returns true when no tabs are selected in current window', () => {
      const visibleTabs = [{ id: 1, windowId: 1 } as chrome.tabs.Tab, { id: 2, windowId: 1 } as chrome.tabs.Tab];
      const selectedTabIds: number[] = [];

      expect(shouldCloseTabsBeDisabled(visibleTabs, selectedTabIds)).toBe(true);
    });

    it('returns false when tabs are selected in current window', () => {
      const visibleTabs = [{ id: 1, windowId: 1 } as chrome.tabs.Tab, { id: 2, windowId: 1 } as chrome.tabs.Tab];
      const selectedTabIds = [1, 2];

      expect(shouldCloseTabsBeDisabled(visibleTabs, selectedTabIds)).toBe(false);
    });

    it('returns true when only other window tabs are selected', () => {
      // This test specifically checks the bug we fixed!
      const visibleTabs = [{ id: 1, windowId: 1 } as chrome.tabs.Tab, { id: 2, windowId: 1 } as chrome.tabs.Tab];
      const selectedTabIds = [3, 4]; // Only tabs from window 2

      expect(shouldCloseTabsBeDisabled(visibleTabs, selectedTabIds)).toBe(true);
    });

    it('returns false when mixed selection includes current window', () => {
      const visibleTabs = [{ id: 1, windowId: 1 } as chrome.tabs.Tab, { id: 2, windowId: 1 } as chrome.tabs.Tab];
      const selectedTabIds = [1, 3, 4]; // Tab 1 from current window, 3 & 4 from others

      expect(shouldCloseTabsBeDisabled(visibleTabs, selectedTabIds)).toBe(false);
    });
  });
});
