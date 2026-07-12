import { createContext, useContext, useMemo, type ReactNode } from 'react';

const RingHighlightContext = createContext<number | null>(null);

interface DropIndicatorState {
  overId: number | null;
  dropPosition: 'top' | 'bottom';
}

const DropIndicatorContext = createContext<DropIndicatorState>({
  overId: null,
  dropPosition: 'bottom',
});

interface DragStateProviderProps {
  overWindowId: number | null;
  overId: number | null;
  dropPosition: 'top' | 'bottom';
  children: ReactNode;
}

export const DragStateProvider = ({ overWindowId, overId, dropPosition, children }: DragStateProviderProps) => {
  const dropIndicatorValue = useMemo(() => ({ overId, dropPosition }), [overId, dropPosition]);
  return (
    <RingHighlightContext.Provider value={overWindowId}>
      <DropIndicatorContext.Provider value={dropIndicatorValue}>{children}</DropIndicatorContext.Provider>
    </RingHighlightContext.Provider>
  );
};

export function useRingHighlight(): number | null {
  return useContext(RingHighlightContext);
}

export function useDropIndicator(): DropIndicatorState {
  return useContext(DropIndicatorContext);
}
