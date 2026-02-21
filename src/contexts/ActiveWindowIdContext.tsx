import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

interface ActiveWindowIdContextProps {
  activeWindowId: number | null;
  refreshActiveWindowId: () => Promise<number | null>;
}

const ActiveWindowIdContext = createContext<ActiveWindowIdContextProps | undefined>(undefined);

export const ActiveWindowIdProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  const [activeWindowId, setActiveWindowId] = useState<number | null>(null);

  const refreshActiveWindowId = useCallback(async (): Promise<number | null> => {
    const window = await chrome.windows.getCurrent();
    const newId = window.id ?? null;
    setActiveWindowId(newId);
    return newId;
  }, []);

  useEffect(() => {
    refreshActiveWindowId();
  }, [refreshActiveWindowId]);

  return (
    <ActiveWindowIdContext.Provider value={{ activeWindowId, refreshActiveWindowId }}>
      {children}
    </ActiveWindowIdContext.Provider>
  );
};

export const useActiveWindowId = () => {
  const context = useContext(ActiveWindowIdContext);
  if (!context) {
    throw new Error('useActiveWindowId must be used within an ActiveWindowIdProvider');
  }
  return context;
};
