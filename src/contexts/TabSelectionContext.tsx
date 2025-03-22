import { createContext, useContext, useState } from 'react';

interface TabSelectionContextProps {
  selectedTabIds: number[];
  addTabToSelection: (tabId: number) => void;
  removeTabFromSelection: (tabId: number) => void;
  clearSelection: () => void;
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

  const value: TabSelectionContextProps = {
    selectedTabIds,
    addTabToSelection,
    removeTabFromSelection,
    clearSelection,
  };

  return <TabSelectionContext.Provider value={value}>{children}</TabSelectionContext.Provider>;
};
