import { createContext, useContext, useState } from 'react';
import {
  syncSelectedTabsWithExisting,
  addTabToSelection as addTabToSelectionUtil,
  removeTabFromSelection as removeTabFromSelectionUtil,
  addTabsToSelectionUnique,
  removeTabsFromSelection as removeTabsFromSelectionUtil,
  clearSelection as clearSelectionUtil,
} from '../utils/tabSelection';

interface TabSelectionContextProps {
  selectedTabIds: number[];
  removingTabIds: Set<number>;
  addTabToSelection: (tabId: number) => void;
  removeTabFromSelection: (tabId: number) => void;
  clearSelection: () => void;
  addTabsToSelection: (tabIds: number[]) => void;
  removeTabsFromSelection: (tabIds: number[]) => void;
  syncWithExistingTabs: (existingTabIds: number[]) => void;
  markTabsAsRemoving: (tabIds: number[]) => void;
  unmarkTabsAsRemoving: (tabIds: number[]) => void;
}

const TabSelectionContext = createContext<TabSelectionContextProps | undefined>(undefined);

export const useTabSelectionContext = () => {
  const context = useContext(TabSelectionContext);
  if (!context) {
    throw new Error('useTabSelectionContext must be used within a TabSelectionContextProvider');
  }
  return context;
};

export const TabSelectionContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedTabIds, setSelectedTabIds] = useState<number[]>([]);
  const [removingTabIds, setRemovingTabIds] = useState<Set<number>>(new Set());

  const addTabToSelection = (tabId: number) => {
    setSelectedTabIds(prevIds => addTabToSelectionUtil(prevIds, tabId));
  };

  const removeTabFromSelection = (tabId: number) => {
    setSelectedTabIds(prevIds => removeTabFromSelectionUtil(prevIds, tabId));
  };

  const clearSelection = () => {
    setSelectedTabIds(clearSelectionUtil());
  };

  const addTabsToSelection = (tabIds: number[]) => {
    setSelectedTabIds(prevIds => addTabsToSelectionUnique(prevIds, tabIds));
  };

  const removeTabsFromSelection = (tabIds: number[]) => {
    setSelectedTabIds(prevIds => removeTabsFromSelectionUtil(prevIds, tabIds));
  };

  const syncWithExistingTabs = (existingTabIds: number[]) => {
    setSelectedTabIds(prevIds => syncSelectedTabsWithExisting(prevIds, existingTabIds));
  };

  const markTabsAsRemoving = (tabIds: number[]) => {
    setRemovingTabIds(prev => {
      const newSet = new Set(prev);
      tabIds.forEach(id => newSet.add(id));
      return newSet;
    });
  };

  const unmarkTabsAsRemoving = (tabIds: number[]) => {
    setRemovingTabIds(prev => {
      const newSet = new Set(prev);
      tabIds.forEach(id => newSet.delete(id));
      return newSet;
    });
  };

  const value: TabSelectionContextProps = {
    selectedTabIds,
    removingTabIds,
    addTabToSelection,
    removeTabFromSelection,
    clearSelection,
    addTabsToSelection,
    removeTabsFromSelection,
    syncWithExistingTabs,
    markTabsAsRemoving,
    unmarkTabsAsRemoving,
  };

  return <TabSelectionContext.Provider value={value}>{children}</TabSelectionContext.Provider>;
};
