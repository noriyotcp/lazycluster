import { describe, it, expect } from 'vitest';
import {
  syncSelectedTabsWithExisting,
  addTabToSelection,
  removeTabFromSelection,
  addTabsToSelectionUnique,
  removeTabsFromSelection,
  clearSelection,
} from './tabSelection';

describe('tabSelection utilities', () => {
  describe('syncSelectedTabsWithExisting', () => {
    it('keeps only existing tab IDs from selection', () => {
      const selected = [1, 2, 3, 4, 5];
      const existing = [2, 4, 6, 8];

      const result = syncSelectedTabsWithExisting(selected, existing);

      expect(result).toEqual([2, 4]);
    });

    it('removes non-existent tab IDs', () => {
      const selected = [1, 2, 3];
      const existing = [4, 5, 6];

      const result = syncSelectedTabsWithExisting(selected, existing);

      expect(result).toEqual([]);
    });

    it('handles empty selected tabs', () => {
      const result = syncSelectedTabsWithExisting([], [1, 2, 3]);
      expect(result).toEqual([]);
    });

    it('handles empty existing tabs (all selected tabs removed)', () => {
      const result = syncSelectedTabsWithExisting([1, 2, 3], []);
      expect(result).toEqual([]);
    });

    it('handles both arrays empty', () => {
      const result = syncSelectedTabsWithExisting([], []);
      expect(result).toEqual([]);
    });

    it('preserves selection order', () => {
      const selected = [5, 3, 1, 4, 2];
      const existing = [1, 2, 3, 4, 5, 6];

      const result = syncSelectedTabsWithExisting(selected, existing);

      expect(result).toEqual([5, 3, 1, 4, 2]);
    });

    it('handles duplicate IDs in existing tabs', () => {
      const selected = [1, 2, 3];
      const existing = [1, 1, 2, 2, 3, 3];

      const result = syncSelectedTabsWithExisting(selected, existing);

      expect(result).toEqual([1, 2, 3]);
    });

    it('works with large datasets efficiently', () => {
      const selected = Array.from({ length: 10000 }, (_, i) => i);
      const existing = Array.from({ length: 10000 }, (_, i) => i * 2);

      const result = syncSelectedTabsWithExisting(selected, existing);

      expect(result.length).toBeLessThanOrEqual(5000);
      result.forEach(id => {
        expect(existing).toContain(id);
      });
    });
  });

  describe('addTabToSelection', () => {
    it('adds a new tab ID to selection', () => {
      const result = addTabToSelection([1, 2], 3);
      expect(result).toEqual([1, 2, 3]);
    });

    it('does not add duplicate tab ID', () => {
      const result = addTabToSelection([1, 2, 3], 2);
      expect(result).toEqual([1, 2, 3]);
    });

    it('handles empty selection', () => {
      const result = addTabToSelection([], 1);
      expect(result).toEqual([1]);
    });
  });

  describe('removeTabFromSelection', () => {
    it('removes specified tab ID from selection', () => {
      const result = removeTabFromSelection([1, 2, 3], 2);
      expect(result).toEqual([1, 3]);
    });

    it('handles non-existent tab ID', () => {
      const result = removeTabFromSelection([1, 2, 3], 4);
      expect(result).toEqual([1, 2, 3]);
    });

    it('handles empty selection', () => {
      const result = removeTabFromSelection([], 1);
      expect(result).toEqual([]);
    });

    it('removes all occurrences if duplicates exist', () => {
      const result = removeTabFromSelection([1, 2, 2, 3], 2);
      expect(result).toEqual([1, 3]);
    });
  });

  describe('addTabsToSelectionUnique', () => {
    it('adds multiple tabs without duplicates', () => {
      const result = addTabsToSelectionUnique([1, 2], [3, 4]);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('prevents duplicate additions', () => {
      const result = addTabsToSelectionUnique([1, 2], [2, 3]);
      expect(result).toEqual([1, 2, 3]);
    });

    it('handles empty initial selection', () => {
      const result = addTabsToSelectionUnique([], [1, 2, 3]);
      expect(result).toEqual([1, 2, 3]);
    });

    it('handles empty tabs to add', () => {
      const result = addTabsToSelectionUnique([1, 2], []);
      expect(result).toEqual([1, 2]);
    });

    it('removes duplicates from existing selection', () => {
      const result = addTabsToSelectionUnique([1, 1, 2, 2], [3]);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('removeTabsFromSelection', () => {
    it('removes multiple tabs from selection', () => {
      const result = removeTabsFromSelection([1, 2, 3, 4, 5], [2, 4]);
      expect(result).toEqual([1, 3, 5]);
    });

    it('handles non-existent tab IDs', () => {
      const result = removeTabsFromSelection([1, 2, 3], [4, 5]);
      expect(result).toEqual([1, 2, 3]);
    });

    it('handles empty selection', () => {
      const result = removeTabsFromSelection([], [1, 2]);
      expect(result).toEqual([]);
    });

    it('handles empty tabs to remove', () => {
      const result = removeTabsFromSelection([1, 2, 3], []);
      expect(result).toEqual([1, 2, 3]);
    });

    it('removes all matching tabs', () => {
      const result = removeTabsFromSelection([1, 2, 3], [1, 2, 3]);
      expect(result).toEqual([]);
    });

    it('works efficiently with large datasets', () => {
      const selected = Array.from({ length: 10000 }, (_, i) => i);
      const toRemove = Array.from({ length: 5000 }, (_, i) => i * 2); // [0, 2, 4, 6, ..., 9998]

      const result = removeTabsFromSelection(selected, toRemove);

      // toRemove contains 5000 even numbers from 0 to 9998
      // All of these are in the selected array (0-9999)
      // So we remove 5000 items from 10000, leaving 5000
      expect(result.length).toBe(5000);
      toRemove.forEach(id => {
        if (id < 10000) {
          expect(result).not.toContain(id);
        }
      });
    });
  });

  describe('clearSelection', () => {
    it('returns empty array', () => {
      const result = clearSelection();
      expect(result).toEqual([]);
    });
  });

  describe('integration scenarios', () => {
    it('handles Close Window scenario correctly', () => {
      // User has tabs 1-5 selected across 2 windows
      const selectedTabIds = [1, 2, 3, 4, 5];
      // Window 1 has tabs 1-3, Window 2 has tabs 4-5
      // User closes Window 1
      const remainingTabs = [4, 5, 6, 7]; // 6, 7 are other unselected tabs

      const result = syncSelectedTabsWithExisting(selectedTabIds, remainingTabs);

      expect(result).toEqual([4, 5]);
    });

    it('handles Close Tabs scenario correctly', () => {
      // User has selected specific tabs
      const selectedTabIds = [2, 4, 6];
      // User clicks Close Tabs
      const tabsToRemove = [2, 4, 6];

      const result = removeTabsFromSelection(selectedTabIds, tabsToRemove);

      expect(result).toEqual([]);
    });

    it('handles browser tab close scenario correctly', () => {
      // User has multiple tabs selected
      const selectedTabIds = [1, 2, 3, 4, 5];
      // User closes tab 3 using browser's X button
      const remainingTabs = [1, 2, 4, 5, 6, 7];

      const result = syncSelectedTabsWithExisting(selectedTabIds, remainingTabs);

      expect(result).toEqual([1, 2, 4, 5]);
    });
  });
});
