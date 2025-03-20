import React from 'react';
import { useWindowGroupContext } from '../contexts/WindowGroupContext';

interface WindowTitleProps {
  windowId: number;
  activeWindowId: number | null;
}

const WindowTitle = ({ windowId, activeWindowId }: WindowTitleProps) => {
  const { windowGroupNumber } = useWindowGroupContext();
  const title = windowId === activeWindowId ? 'Current Window' : `Window ${windowGroupNumber}`;
  return <h2 className="window-title">{title}</h2>;
};

export default WindowTitle;
