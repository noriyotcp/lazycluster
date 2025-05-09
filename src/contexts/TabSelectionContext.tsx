import { createContext, useContext, useState } from 'react';

interface TabSelectionContextProps {
  selectedTabIds: number[];
  addTabToSelection: (tabId: number) => void;
  removeTabFromSelection: (tabId: number) => void;
  clearSelection: () => void;
  addTabsToSelection: (tabIds: number[]) => void;
  removeTabsFromSelection: (tabIds: number[]) => void;
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

  const addTabToSelection = (tabId: number) => {
    setSelectedTabIds([...selectedTabIds, tabId]);
  };

  const removeTabFromSelection = (tabId: number) => {
    setSelectedTabIds(selectedTabIds.filter(id => id !== tabId));
  };

  const clearSelection = () => {
    setSelectedTabIds([]);
  };

  const addTabsToSelection = (tabIds: number[]) => {
    setSelectedTabIds(prevSelectedTabIds => [...new Set([...prevSelectedTabIds, ...tabIds])]);
  };

  const removeTabsFromSelection = (tabIds: number[]) => {
    setSelectedTabIds(prevSelectedTabIds => prevSelectedTabIds.filter(id => !tabIds.includes(id)));
  };

  const value: TabSelectionContextProps = {
    selectedTabIds,
    addTabToSelection,
    removeTabFromSelection,
    clearSelection,
    addTabsToSelection,
    removeTabsFromSelection,
  };

  return <TabSelectionContext.Provider value={value}>{children}</TabSelectionContext.Provider>;
};
