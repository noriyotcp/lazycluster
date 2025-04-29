import { createContext, useContext, useState } from 'react';
import { useToast } from '../components/ToastProvider';
import Alert from '../components/Alert';

interface TabSelectionContextProps {
  selectedTabIds: number[];
  addTabToSelection: (tabId: number) => void;
  removeTabFromSelection: (tabId: number) => void;
  clearSelection: () => void;
  addWindowTabsToSelection: (windowId: number) => void;
  removeWindowTabsFromSelection: (windowId: number) => void;
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

  const { showToast } = useToast();

  const addWindowTabsToSelection = async (windowId: number) => {
    try {
      const tabs = await chrome.tabs.query({ windowId });
      const tabIds = tabs.map(tab => tab.id).filter((id): id is number => id !== undefined);
      setSelectedTabIds(prevSelectedTabIds => [...new Set([...prevSelectedTabIds, ...tabIds])]);
    } catch (error) {
      showToast(
        <Alert
          message={`Error adding window tabs to selection: ${error instanceof Error ? error.message : String(error)}`}
        />
      );
      console.error('Error adding window tabs to selection:', error);
    }
  };

  const removeWindowTabsFromSelection = async (windowId: number) => {
    try {
      const tabs = await chrome.tabs.query({ windowId });
      const tabIds = tabs.map(tab => tab.id).filter((id): id is number => id !== undefined);
      setSelectedTabIds(prevSelectedTabIds => prevSelectedTabIds.filter(id => !tabIds.includes(id)));
    } catch (error) {
      showToast(
        <Alert
          message={`Error removing window tabs from selection: ${error instanceof Error ? error.message : String(error)}`}
        />
      );
      console.error('Error removing window tabs from selection:', error);
    }
  };

  const value: TabSelectionContextProps = {
    selectedTabIds,
    addTabToSelection,
    removeTabFromSelection,
    clearSelection,
    addWindowTabsToSelection,
    removeWindowTabsFromSelection,
  };

  return <TabSelectionContext.Provider value={value}>{children}</TabSelectionContext.Provider>;
};
