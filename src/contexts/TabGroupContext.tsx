import React, { createContext, useState, useCallback, useContext } from 'react';

interface TabGroup {
  windowId: number;
  tabs: chrome.tabs.Tab[];
}

interface TabGroupContextProps {
  tabGroups: TabGroup[];
  updateTabGroups: (tabs: chrome.tabs.Tab[]) => void;
}

const TabGroupContext = createContext<TabGroupContextProps | undefined>(undefined);

export const TabGroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);

  const updateTabGroups = useCallback((updatedTabs: chrome.tabs.Tab[]) => {
    const groupedTabs = groupTabsByWindow(updatedTabs);
    // Get active window ID within the message handling
    chrome.windows.getCurrent().then(window => {
      if (window.id !== undefined) {
        const sortedTabGroups = sortTabGroups(groupedTabs, window.id);
        setTabGroups(sortedTabGroups);
      } else {
        setTabGroups(groupedTabs);
      }
    });
  }, []);

  const sortTabGroups = (tabGroups: TabGroup[], activeWindowId: number | null): TabGroup[] => {
    if (activeWindowId === null) {
      return tabGroups; // No sorting needed if active window ID is not available
    }

    const activeWindowGroupIndex = tabGroups.findIndex(group => group.windowId === activeWindowId);

    if (activeWindowGroupIndex === -1) {
      return tabGroups; // No sorting needed if the active window group is not found
    }

    const activeWindowGroup = tabGroups.splice(activeWindowGroupIndex, 1)[0]; // Extracts the active window's group
    return [activeWindowGroup, ...tabGroups]; // Insert the active window group at the beginning
  };

  const groupTabsByWindow = (tabs: chrome.tabs.Tab[]): TabGroup[] => {
    const groups: { [windowId: number]: chrome.tabs.Tab[] } = {};
    tabs.forEach(tab => {
      if (tab.windowId) {
        if (!groups[tab.windowId]) {
          groups[tab.windowId] = [];
        }
        groups[tab.windowId].push(tab);
      }
    });

    return Object.entries(groups).map(([windowId, tabs]) => ({ windowId: parseInt(windowId), tabs }));
  };

  const value: TabGroupContextProps = {
    tabGroups,
    updateTabGroups,
  };

  return <TabGroupContext.Provider value={value}>{children}</TabGroupContext.Provider>;
};

export const useTabGroupContext = () => {
  const context = useContext(TabGroupContext);
  if (!context) {
    throw new Error('useTabGroupContext must be used within a TabGroupProvider');
  }
  return context;
};
