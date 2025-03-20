import React from 'react';

interface WindowTitleProps {
  windowId: number;
  activeWindowId: number | null;
  sequenceNumber: number;
}

const WindowTitle = ({ windowId, activeWindowId, sequenceNumber }: WindowTitleProps) => {
  const title = windowId === activeWindowId ? 'Current Window' : `Window ${sequenceNumber}`;
  return <h2 className="window-title">{title}</h2>;
};

export default WindowTitle;
