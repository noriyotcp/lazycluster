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
      const selectedTabIds = new Set<number>();

      expect(countSelectedIds(visibleTabIds, selectedTabIds)).toBe(0);
    });

    it('counts matching IDs correctly', () => {
      const visibleTabIds = [1, 2];
      const selectedTabIds = new Set([1, 2, 3, 4]); // 3, 4 are not in visibleTabIds

      expect(countSelectedIds(visibleTabIds, selectedTabIds)).toBe(2);
    });

    it('handles empty visible IDs', () => {
      const visibleTabIds: number[] = [];
      const selectedTabIds = new Set([1, 2, 3]);

      expect(countSelectedIds(visibleTabIds, selectedTabIds)).toBe(0);
    });

    it('returns 0 when no IDs match', () => {
      const visibleTabIds = [1, 2];
      const selectedTabIds = new Set([3, 4]); // No overlap

      expect(countSelectedIds(visibleTabIds, selectedTabIds)).toBe(0);
    });

    it('counts partial matches correctly', () => {
      const visibleTabIds = [1, 2, 3, 4, 5];
      const selectedTabIds = new Set([2, 4, 6, 8]); // Only 2 and 4 match

      expect(countSelectedIds(visibleTabIds, selectedTabIds)).toBe(2);
    });
  });

  describe('shouldBulkSelectBeChecked', () => {
    it('returns false when no IDs exist', () => {
      const visibleTabIds: number[] = [];
      const selectedTabIds = new Set<number>();

      expect(shouldBulkSelectBeChecked(visibleTabIds, selectedTabIds)).toBe(false);
    });

    it('returns true when all visible IDs are selected', () => {
      const visibleTabIds = [1, 2];
      const selectedTabIds = new Set([1, 2, 3]); // Including extra selections

      expect(shouldBulkSelectBeChecked(visibleTabIds, selectedTabIds)).toBe(true);
    });

    it('returns false when only some visible IDs are selected', () => {
      const visibleTabIds = [1, 2];
      const selectedTabIds = new Set([1]); // Only one selected

      expect(shouldBulkSelectBeChecked(visibleTabIds, selectedTabIds)).toBe(false);
    });

    it('returns false when no visible IDs are selected', () => {
      const visibleTabIds = [1, 2];
      const selectedTabIds = new Set([3, 4]); // Other IDs

      expect(shouldBulkSelectBeChecked(visibleTabIds, selectedTabIds)).toBe(false);
    });

    it('returns true when exact match of IDs', () => {
      const visibleTabIds = [1, 2, 3];
      const selectedTabIds = new Set([1, 2, 3]);

      expect(shouldBulkSelectBeChecked(visibleTabIds, selectedTabIds)).toBe(true);
    });

    it('returns true when all visible IDs are in larger selection', () => {
      const visibleTabIds = [2, 4];
      const selectedTabIds = new Set([1, 2, 3, 4, 5]); // Superset

      expect(shouldBulkSelectBeChecked(visibleTabIds, selectedTabIds)).toBe(true);
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
      const selectedTabIds = new Set<number>();

      expect(shouldCloseTabsBeDisabled(visibleTabIds, selectedTabIds)).toBe(true);
    });

    it('returns false when IDs are selected', () => {
      const visibleTabIds = [1, 2];
      const selectedTabIds = new Set([1, 2]);

      expect(shouldCloseTabsBeDisabled(visibleTabIds, selectedTabIds)).toBe(false);
    });

    it('returns true when no matching IDs are selected', () => {
      const visibleTabIds = [1, 2];
      const selectedTabIds = new Set([3, 4]); // No overlap

      expect(shouldCloseTabsBeDisabled(visibleTabIds, selectedTabIds)).toBe(true);
    });

    it('returns false when at least one ID matches', () => {
      const visibleTabIds = [1, 2];
      const selectedTabIds = new Set([1, 3, 4]); // Only 1 matches

      expect(shouldCloseTabsBeDisabled(visibleTabIds, selectedTabIds)).toBe(false);
    });
  });
});
