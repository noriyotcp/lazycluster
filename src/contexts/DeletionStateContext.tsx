import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DeletionStateContextType {
  deletingWindowIds: Set<number>;
  deletingTabIds: Set<number>;
  setDeletingState: (params: { type: 'window' | 'tab'; id: number; isDeleting: boolean }) => void;
  isDeleting: (params: { type: 'window' | 'tab'; id: number }) => boolean;
  cleanupNonExistentItems: (params: { existingTabIds: number[]; existingWindowIds: number[] }) => void;
}

const DeletionStateContext = createContext<DeletionStateContextType | undefined>(undefined);

export const DeletionStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [deletingWindowIds, setDeletingWindowIds] = useState<Set<number>>(new Set());
  const [deletingTabIds, setDeletingTabIds] = useState<Set<number>>(new Set());

  const setDeletingState = useCallback(
    ({ type, id, isDeleting }: { type: 'window' | 'tab'; id: number; isDeleting: boolean }) => {
      if (type === 'window') {
        setDeletingWindowIds(prev => {
          const next = new Set(prev);
          if (isDeleting) {
            next.add(id);
          } else {
            next.delete(id);
          }
          return next;
        });
      } else {
        setDeletingTabIds(prev => {
          const next = new Set(prev);
          if (isDeleting) {
            next.add(id);
          } else {
            next.delete(id);
          }
          return next;
        });
      }
    },
    []
  );

  const isDeleting = useCallback(
    ({ type, id }: { type: 'window' | 'tab'; id: number }) => {
      if (type === 'window') {
        return deletingWindowIds.has(id);
      } else {
        return deletingTabIds.has(id);
      }
    },
    [deletingWindowIds, deletingTabIds]
  );

  const cleanupNonExistentItems = useCallback(
    ({ existingTabIds, existingWindowIds }: { existingTabIds: number[]; existingWindowIds: number[] }) => {
      // Clean up tab IDs that no longer exist
      setDeletingTabIds(prev => {
        const next = new Set<number>();
        prev.forEach(id => {
          if (existingTabIds.includes(id)) {
            next.add(id);
          }
        });
        return next.size === prev.size ? prev : next;
      });

      // Clean up window IDs that no longer exist
      setDeletingWindowIds(prev => {
        const next = new Set<number>();
        prev.forEach(id => {
          if (existingWindowIds.includes(id)) {
            next.add(id);
          }
        });
        return next.size === prev.size ? prev : next;
      });
    },
    []
  );

  return (
    <DeletionStateContext.Provider
      value={{
        deletingWindowIds,
        deletingTabIds,
        setDeletingState,
        isDeleting,
        cleanupNonExistentItems,
      }}
    >
      {children}
    </DeletionStateContext.Provider>
  );
};

export const useDeletionState = () => {
  const context = useContext(DeletionStateContext);
  if (!context) {
    throw new Error('useDeletionState must be used within a DeletionStateProvider');
  }
  return context;
};
