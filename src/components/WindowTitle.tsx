import React from 'react';
import { useWindowGroupContext } from '../contexts/WindowGroupContext';

interface WindowTitleProps {
  windowId: number;
  activeWindowId: number | null;
}

const WindowTitle = ({ windowId, activeWindowId }: WindowTitleProps) => {
  const { sequenceNumber } = useWindowGroupContext();
  const title = windowId === activeWindowId ? 'Current Window' : `Window ${sequenceNumber}`;
  return <h2 className="window-title">{title}</h2>;
};

export default WindowTitle;
