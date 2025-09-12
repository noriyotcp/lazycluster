import { describe, it, expect } from 'vitest';
import { analyzeTabDeletion, isLastTabInWindow, groupTabIdsByWindow } from './deletionHelpers';

describe('deletionHelpers', () => {
  describe('analyzeTabDeletion', () => {
    it('should identify full window selection when all tabs are selected', () => {
      const allTabs: chrome.tabs.Tab[] = [
        { id: 1, windowId: 100, index: 0 } as chrome.tabs.Tab,
        { id: 2, windowId: 100, index: 1 } as chrome.tabs.Tab,
        { id: 3, windowId: 200, index: 0 } as chrome.tabs.Tab,
      ];
      const selectedTabIds = [1, 2]; // All tabs in window 100

      const result = analyzeTabDeletion(selectedTabIds, allTabs);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        windowId: 100,
        selectedTabIds: [1, 2],
        totalTabsInWindow: 2,
        isFullWindowSelection: true,
      });
    });

    it('should identify partial window selection when some tabs are selected', () => {
      const allTabs: chrome.tabs.Tab[] = [
        { id: 1, windowId: 100, index: 0 } as chrome.tabs.Tab,
        { id: 2, windowId: 100, index: 1 } as chrome.tabs.Tab,
        { id: 3, windowId: 100, index: 2 } as chrome.tabs.Tab,
      ];
      const selectedTabIds = [1, 3]; // Only 2 of 3 tabs

      const result = analyzeTabDeletion(selectedTabIds, allTabs);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        windowId: 100,
        selectedTabIds: [1, 3],
        totalTabsInWindow: 3,
        isFullWindowSelection: false,
      });
    });

    it('should handle multiple windows with mixed selections', () => {
      const allTabs: chrome.tabs.Tab[] = [
        { id: 1, windowId: 100, index: 0 } as chrome.tabs.Tab,
        { id: 2, windowId: 100, index: 1 } as chrome.tabs.Tab,
        { id: 3, windowId: 200, index: 0 } as chrome.tabs.Tab,
        { id: 4, windowId: 200, index: 1 } as chrome.tabs.Tab,
        { id: 5, windowId: 300, index: 0 } as chrome.tabs.Tab,
      ];
      const selectedTabIds = [1, 2, 3]; // All from window 100, partial from window 200

      const result = analyzeTabDeletion(selectedTabIds, allTabs);

      expect(result).toHaveLength(2);

      const window100Result = result.find(r => r.windowId === 100);
      expect(window100Result).toEqual({
        windowId: 100,
        selectedTabIds: [1, 2],
        totalTabsInWindow: 2,
        isFullWindowSelection: true,
      });

      const window200Result = result.find(r => r.windowId === 200);
      expect(window200Result).toEqual({
        windowId: 200,
        selectedTabIds: [3],
        totalTabsInWindow: 2,
        isFullWindowSelection: false,
      });
    });

    it('should return empty array when no tabs are selected', () => {
      const allTabs: chrome.tabs.Tab[] = [
        { id: 1, windowId: 100, index: 0 } as chrome.tabs.Tab,
        { id: 2, windowId: 100, index: 1 } as chrome.tabs.Tab,
      ];
      const selectedTabIds: number[] = [];

      const result = analyzeTabDeletion(selectedTabIds, allTabs);

      expect(result).toEqual([]);
    });

    it('should handle tabs without windowId', () => {
      const allTabs: chrome.tabs.Tab[] = [
        { id: 1, windowId: 100, index: 0 } as chrome.tabs.Tab,
        { id: 2, index: 1 } as chrome.tabs.Tab, // No windowId
        { id: 3, windowId: 100, index: 2 } as chrome.tabs.Tab,
      ];
      const selectedTabIds = [1, 2, 3];

      const result = analyzeTabDeletion(selectedTabIds, allTabs);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        windowId: 100,
        selectedTabIds: [1, 3],
        totalTabsInWindow: 2,
        isFullWindowSelection: true,
      });
    });
  });

  describe('isLastTabInWindow', () => {
    it('should return true when tab is the only tab in the window', () => {
      const windowTabs: chrome.tabs.Tab[] = [{ id: 1, windowId: 100, index: 0 } as chrome.tabs.Tab];

      const result = isLastTabInWindow(1, windowTabs);

      expect(result).toBe(true);
    });

    it('should return false when there are multiple tabs in the window', () => {
      const windowTabs: chrome.tabs.Tab[] = [
        { id: 1, windowId: 100, index: 0 } as chrome.tabs.Tab,
        { id: 2, windowId: 100, index: 1 } as chrome.tabs.Tab,
      ];

      const result = isLastTabInWindow(1, windowTabs);

      expect(result).toBe(false);
    });

    it('should return false when checking for a different tab ID', () => {
      const windowTabs: chrome.tabs.Tab[] = [{ id: 1, windowId: 100, index: 0 } as chrome.tabs.Tab];

      const result = isLastTabInWindow(2, windowTabs);

      expect(result).toBe(false);
    });

    it('should handle tabs without id correctly', () => {
      const windowTabs: chrome.tabs.Tab[] = [
        { windowId: 100, index: 0 } as chrome.tabs.Tab, // No id
        { id: 2, windowId: 100, index: 1 } as chrome.tabs.Tab,
      ];

      const result = isLastTabInWindow(2, windowTabs);

      expect(result).toBe(true); // Only one tab with valid id
    });
  });

  describe('groupTabIdsByWindow', () => {
    it('should group tab IDs by their window ID', () => {
      const allTabs: chrome.tabs.Tab[] = [
        { id: 1, windowId: 100, index: 0 } as chrome.tabs.Tab,
        { id: 2, windowId: 100, index: 1 } as chrome.tabs.Tab,
        { id: 3, windowId: 200, index: 0 } as chrome.tabs.Tab,
        { id: 4, windowId: 200, index: 1 } as chrome.tabs.Tab,
      ];
      const tabIds = [1, 3, 4];

      const result = groupTabIdsByWindow(tabIds, allTabs);

      expect(result.size).toBe(2);
      expect(result.get(100)).toEqual([1]);
      expect(result.get(200)).toEqual([3, 4]);
    });

    it('should return empty map when no tabs match', () => {
      const allTabs: chrome.tabs.Tab[] = [
        { id: 1, windowId: 100, index: 0 } as chrome.tabs.Tab,
        { id: 2, windowId: 100, index: 1 } as chrome.tabs.Tab,
      ];
      const tabIds = [3, 4]; // Non-existent tab IDs

      const result = groupTabIdsByWindow(tabIds, allTabs);

      expect(result.size).toBe(0);
    });

    it('should handle tabs without id or windowId', () => {
      const allTabs: chrome.tabs.Tab[] = [
        { id: 1, windowId: 100, index: 0 } as chrome.tabs.Tab,
        { id: 2, index: 1 } as chrome.tabs.Tab, // No windowId
        { windowId: 200, index: 0 } as chrome.tabs.Tab, // No id
        { id: 4, windowId: 200, index: 1 } as chrome.tabs.Tab,
      ];
      const tabIds = [1, 2, 4];

      const result = groupTabIdsByWindow(tabIds, allTabs);

      expect(result.size).toBe(2);
      expect(result.get(100)).toEqual([1]);
      expect(result.get(200)).toEqual([4]);
    });

    it('should handle empty inputs', () => {
      const result1 = groupTabIdsByWindow([], []);
      expect(result1.size).toBe(0);

      const allTabs: chrome.tabs.Tab[] = [{ id: 1, windowId: 100, index: 0 } as chrome.tabs.Tab];
      const result2 = groupTabIdsByWindow([], allTabs);
      expect(result2.size).toBe(0);

      const result3 = groupTabIdsByWindow([1], []);
      expect(result3.size).toBe(0);
    });
  });
});
