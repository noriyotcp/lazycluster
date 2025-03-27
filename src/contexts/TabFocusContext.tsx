import React, { createContext, useContext, PropsWithChildren, useCallback } from 'react';

interface TabFocusContextType {
  focusActiveTab: (tabId: number, windowId: number) => Promise<void>;
}

const TabFocusContext = createContext<TabFocusContextType | undefined>(undefined);

export const TabFocusProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const focusActiveTab = useCallback(async (tabId: number, windowId: number) => {
    try {
      // まず対象のウィンドウをフォーカスする
      await chrome.windows.update(windowId, { focused: true });
      // 次に対象のタブをアクティブにする
      await chrome.tabs.update(tabId, { active: true });
      console.log(`Focused tab ${tabId} in window ${windowId}`);
    } catch (error) {
      console.error(`Error focusing tab ${tabId} in window ${windowId}:`, error);
      // エラーハンドリングをここに追加することもできるよん
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
