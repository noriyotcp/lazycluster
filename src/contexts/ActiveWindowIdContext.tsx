import React, { createContext, useState, useEffect, useContext } from 'react';

interface ActiveWindowIdContextProps {
  activeWindowId: number | null;
}

const ActiveWindowIdContext = createContext<ActiveWindowIdContextProps | undefined>(undefined);

export const ActiveWindowIdProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  const [activeWindowId, setActiveWindowId] = useState<number | null>(null);

  useEffect(() => {
    chrome.windows.getCurrent().then(window => {
      if (window.id !== undefined) {
        setActiveWindowId(window.id);
      }
    });
  }, []);

  return <ActiveWindowIdContext.Provider value={{ activeWindowId }}>{children}</ActiveWindowIdContext.Provider>;
};

export const useActiveWindowId = () => {
  const context = useContext(ActiveWindowIdContext);
  if (!context) {
    throw new Error('useActiveWindowId must be used within an ActiveWindowIdProvider');
  }
  return context;
};
