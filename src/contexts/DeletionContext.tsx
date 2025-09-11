import { createContext, useContext, useState, ReactNode } from 'react';

interface DeletionContextProps {
  removingTabIds: Set<number>;
  removingWindowIds: Set<number>;
  markTabsAsRemoving: (tabIds: number[]) => void;
  unmarkTabsAsRemoving: (tabIds: number[]) => void;
  markWindowAsRemoving: (windowId: number) => void;
  unmarkWindowAsRemoving: (windowId: number) => void;
  clearAllRemoving: () => void;
}

const DeletionContext = createContext<DeletionContextProps | undefined>(undefined);

export const useDeletionContext = () => {
  const context = useContext(DeletionContext);
  if (!context) {
    throw new Error('useDeletionContext must be used within a DeletionProvider');
  }
  return context;
};

export const DeletionProvider = ({ children }: { children: ReactNode }) => {
  const [removingTabIds, setRemovingTabIds] = useState<Set<number>>(new Set());
  const [removingWindowIds, setRemovingWindowIds] = useState<Set<number>>(new Set());

  const markTabsAsRemoving = (tabIds: number[]) => {
    setRemovingTabIds(prev => {
      const newSet = new Set(prev);
      tabIds.forEach(id => newSet.add(id));
      return newSet;
    });
  };

  const unmarkTabsAsRemoving = (tabIds: number[]) => {
    setRemovingTabIds(prev => {
      const newSet = new Set(prev);
      tabIds.forEach(id => newSet.delete(id));
      return newSet;
    });
  };

  const markWindowAsRemoving = (windowId: number) => {
    setRemovingWindowIds(prev => new Set(prev).add(windowId));
  };

  const unmarkWindowAsRemoving = (windowId: number) => {
    setRemovingWindowIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(windowId);
      return newSet;
    });
  };

  const clearAllRemoving = () => {
    setRemovingTabIds(new Set());
    setRemovingWindowIds(new Set());
  };

  const value: DeletionContextProps = {
    removingTabIds,
    removingWindowIds,
    markTabsAsRemoving,
    unmarkTabsAsRemoving,
    markWindowAsRemoving,
    unmarkWindowAsRemoving,
    clearAllRemoving,
  };

  return <DeletionContext.Provider value={value}>{children}</DeletionContext.Provider>;
};
