import React from 'react';

interface WindowTitleProps {
  windowId: number;
  activeWindowId: number | null;
}

const WindowTitle: React.FC<WindowTitleProps> = ({ windowId, activeWindowId }) => {
  const title = windowId === activeWindowId ? 'Current Window' : `Window ${windowId}`;
  return <h2 className="window-title">{title}</h2>;
};

export default WindowTitle;
