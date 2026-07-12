import { memo } from 'react';
import { useDropIndicator } from '../contexts/DragStateContexts';

interface TabDropIndicatorProps {
  tabId: number;
  position: 'top' | 'bottom';
}

const TabDropIndicator = ({ tabId, position }: TabDropIndicatorProps) => {
  const { overId, dropPosition } = useDropIndicator();
  const active = overId === tabId && dropPosition === position;
  return <div className={`h-0.5 bg-info transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`} />;
};

export default memo(TabDropIndicator);
