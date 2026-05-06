import { useState, useEffect, useCallback } from 'react';
import type { SavedTabGroup } from '../types/savedTabs';
import {
  loadSavedTabGroups,
  addSavedTabGroup,
  deleteSavedTabGroup,
  clearAllSavedTabGroups,
} from '../utils/savedTabs';

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
    async (id: string): Promise<void> => {
      const group = savedTabGroups.find(g => g.id === id);
      if (!group) return;
      await chrome.windows.create({ url: group.tabs.map(t => t.url) });
      await deleteSavedTabGroup(id);
      setSavedTabGroups(prev => prev.filter(g => g.id !== id));
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
