import { createContext, useContext, useState} from 'react';

interface TabSelectionContextProps {
  selectedTabIds: Set<number>;
  lastSelectedIndex: number | null;
  addTabToSelection: (tabId: number) => void;
  removeTabFromSelection: (tabId: number) => void;
  clearSelection: () => void;
  addTabsToSelection: (tabIds: number[]) => void;
  removeTabsFromSelection: (tabIds: number[]) => void;
  syncWithExistingTabs: (existingTabIds: number[]) => void;
  setLastSelectedIndex: (index: number | null) => void;
  getSelectedTabIdsArray: () => number[];
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
  const [selectedTabIds, setSelectedTabIds] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const addTabToSelection = (tabId: number) => {
    setSelectedTabIds(prev => {
      const newSet = new Set(prev);
      newSet.add(tabId);
      return newSet;
    });
  };

  const removeTabFromSelection = (tabId: number) => {
    setSelectedTabIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(tabId);
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedTabIds(new Set());
  };

  const addTabsToSelection = (tabIds: number[]) => {
    setSelectedTabIds(prev => {
      const newSet = new Set(prev);
      tabIds.forEach(id => newSet.add(id));
      return newSet;
    });
  };

  const removeTabsFromSelection = (tabIds: number[]) => {
    setSelectedTabIds(prev => {
      const newSet = new Set(prev);
      tabIds.forEach(id => newSet.delete(id));
      return newSet;
    });
  };

  const syncWithExistingTabs = (existingTabIds: number[]) => {
    setSelectedTabIds(prev => {
      const existingSet = new Set(existingTabIds);
      const newSet = new Set<number>();
      prev.forEach(id => {
        if (existingSet.has(id)) {
          newSet.add(id);
        }
      });
      return newSet;
    });
  };

  const getSelectedTabIdsArray = (): number[] => {
    return Array.from(selectedTabIds);
  };

  const value: TabSelectionContextProps = {
    selectedTabIds,
    lastSelectedIndex,
    addTabToSelection,
    removeTabFromSelection,
    clearSelection,
    addTabsToSelection,
    removeTabsFromSelection,
    syncWithExistingTabs,
    setLastSelectedIndex,
    getSelectedTabIdsArray,
  };

  return <TabSelectionContext.Provider value={value}>{children}</TabSelectionContext.Provider>;
};
