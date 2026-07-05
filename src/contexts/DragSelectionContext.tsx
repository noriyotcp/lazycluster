import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import * as dragSelectionUtils from '../utils/dragSelection';

interface DragSelectionContextProps {
  dragSelectedTabIds: Set<number>;
  lastDragSelectedIndex: number | null;
  windowId: number | null;
  addTabToDragSelection: (tabId: number, windowId: number, index: number) => void;
  removeTabFromDragSelection: (tabId: number) => void;
  clearDragSelection: () => void;
  addTabsToDragSelection: (tabIds: number[], windowId: number) => void;
  setLastDragSelectedIndex: (index: number | null) => void;
}

const DragSelectionContext = createContext<DragSelectionContextProps | undefined>(undefined);

export const useDragSelectionContext = () => {
  const context = useContext(DragSelectionContext);
  if (!context) {
    throw new Error('useDragSelectionContext must be used within a DragSelectionContextProvider');
  }
  return context;
};

export const DragSelectionContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [dragSelectedTabIds, setDragSelectedTabIds] = useState<Set<number>>(new Set());
  const [lastDragSelectedIndex, setLastDragSelectedIndex] = useState<number | null>(null);
  const [windowId, setWindowId] = useState<number | null>(null);

  const addTabToDragSelection = useCallback(
    (tabId: number, tabWindowId: number, index: number) => {
      const result = dragSelectionUtils.addTabToDragSelection(dragSelectedTabIds, windowId, tabId, tabWindowId);
      setDragSelectedTabIds(result.selectedIds);
      setWindowId(result.windowId);
      setLastDragSelectedIndex(index);
    },
    [dragSelectedTabIds, windowId]
  );

  const removeTabFromDragSelection = useCallback(
    (tabId: number) => {
      setDragSelectedTabIds(dragSelectionUtils.removeTabFromDragSelection(dragSelectedTabIds, tabId));
    },
    [dragSelectedTabIds]
  );

  const clearDragSelection = useCallback(() => {
    setDragSelectedTabIds(dragSelectionUtils.clearDragSelection());
    setWindowId(null);
    setLastDragSelectedIndex(null);
  }, []);

  const addTabsToDragSelection = useCallback(
    (tabIds: number[], tabWindowId: number) => {
      const result = dragSelectionUtils.addTabsToDragSelection(dragSelectedTabIds, windowId, tabIds, tabWindowId);
      setDragSelectedTabIds(result.selectedIds);
      setWindowId(result.windowId);
    },
    [dragSelectedTabIds, windowId]
  );

  const value = useMemo<DragSelectionContextProps>(
    () => ({
      dragSelectedTabIds,
      lastDragSelectedIndex,
      windowId,
      addTabToDragSelection,
      removeTabFromDragSelection,
      clearDragSelection,
      addTabsToDragSelection,
      setLastDragSelectedIndex,
    }),
    [
      dragSelectedTabIds,
      lastDragSelectedIndex,
      windowId,
      addTabToDragSelection,
      removeTabFromDragSelection,
      clearDragSelection,
      addTabsToDragSelection,
    ]
  );

  return <DragSelectionContext.Provider value={value}>{children}</DragSelectionContext.Provider>;
};
