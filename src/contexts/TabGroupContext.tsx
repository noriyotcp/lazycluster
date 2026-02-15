import React, { createContext, useState, useCallback, useContext } from 'react';

interface TabGroup {
  windowId: number;
  tabs: chrome.tabs.Tab[];
}

interface TabGroupContextProps {
  tabGroups: TabGroup[];
  updateTabGroups: (tabs: chrome.tabs.Tab[], activeWindowId?: number) => void;
}

const TabGroupContext = createContext<TabGroupContextProps | undefined>(undefined);

export const TabGroupProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);

  const updateTabGroups = useCallback((updatedTabs: chrome.tabs.Tab[], activeWindowId?: number) => {
    const groupedTabs = groupTabsByWindow(updatedTabs);
    if (activeWindowId !== undefined) {
      const sortedTabGroups = sortTabGroups(groupedTabs, activeWindowId);
      setTabGroups(sortedTabGroups);
    } else {
      setTabGroups(groupedTabs);
    }
  }, []);

  const sortTabGroups = (tabGroups: TabGroup[], activeWindowId: number): TabGroup[] => {
    const activeGroup = tabGroups.find(group => group.windowId === activeWindowId);
    if (!activeGroup) return tabGroups;
    return [activeGroup, ...tabGroups.filter(group => group.windowId !== activeWindowId)];
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
