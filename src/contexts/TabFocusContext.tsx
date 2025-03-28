import React, { createContext, useContext, PropsWithChildren, useCallback } from 'react';

interface TabFocusContextType {
  focusActiveTab: (tabId: number, windowId: number) => Promise<void>;
}

const TabFocusContext = createContext<TabFocusContextType | undefined>(undefined);

export const TabFocusProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const focusActiveTab = useCallback(async (tabId: number, windowId: number) => {
    try {
      // First, focus the target window
      await chrome.windows.update(windowId, { focused: true });
      // Then, activate the target tab
      await chrome.tabs.update(tabId, { active: true });
      console.log(`Focused tab ${tabId} in window ${windowId}`);
    } catch (error) {
      console.error(`Error focusing tab ${tabId} in window ${windowId}:`, error);
      // Additional error handling can be added here
    }
  }, []);

  const value: TabFocusContextType = {
    focusActiveTab,
  };

  return <TabFocusContext.Provider value={value}>{children}</TabFocusContext.Provider>;
};

export const useTabFocusContext = () => {
  const context = useContext(TabFocusContext);
  if (!context) {
    throw new Error('useTabFocusContext must be used within a TabFocusProvider');
  }
  return context;
};
