import { useState, useEffect, useCallback } from 'react';
import type { SavedTabGroup } from '../types/savedTabs';
import {
  loadSavedTabGroups,
  addSavedTabGroup,
  deleteSavedTabGroup,
  clearAllSavedTabGroups,
  isRestorableUrl,
} from '../utils/savedTabs';

export interface RestoreResult {
  restoredCount: number;
  filteredCount: number;
}

export function useSavedTabs() {
  const [savedTabGroups, setSavedTabGroups] = useState<SavedTabGroup[]>([]);

  useEffect(() => {
    loadSavedTabGroups().then(setSavedTabGroups);
  }, []);

  const saveInactiveTabs = useCallback(async (tabs: chrome.tabs.Tab[]): Promise<SavedTabGroup> => {
    const group = await addSavedTabGroup(tabs);
    setSavedTabGroups(prev => [group, ...prev]);
    return group;
  }, []);

  const restoreGroup = useCallback(
    async (id: string): Promise<RestoreResult> => {
      const group = savedTabGroups.find(g => g.id === id);
      if (!group) return { restoredCount: 0, filteredCount: 0 };

      const restorableUrls = group.tabs.map(t => t.url).filter(isRestorableUrl);
      const filteredCount = group.tabs.length - restorableUrls.length;

      if (restorableUrls.length === 0) {
        throw new Error(
          `No restorable URLs in this group (${filteredCount} URL(s) are chrome://, extension pages, or otherwise not openable from an extension).`
        );
      }

      await chrome.windows.create({ url: restorableUrls });
      await deleteSavedTabGroup(id);
      setSavedTabGroups(prev => prev.filter(g => g.id !== id));

      return { restoredCount: restorableUrls.length, filteredCount };
    },
    [savedTabGroups]
  );

  const deleteGroup = useCallback(async (id: string): Promise<void> => {
    await deleteSavedTabGroup(id);
    setSavedTabGroups(prev => prev.filter(g => g.id !== id));
  }, []);

  const clearAll = useCallback(async (): Promise<void> => {
    await clearAllSavedTabGroups();
    setSavedTabGroups([]);
  }, []);

  return { savedTabGroups, saveInactiveTabs, restoreGroup, deleteGroup, clearAll };
}
