import React from 'react';
import WindowTitle from './WindowTitle';

interface WindowHeaderProps {
  windowId: number;
  activeWindowId: number | null;
}

const WindowHeader = ({ windowId, activeWindowId }: WindowHeaderProps) => {
  return (
    <div className="window-header">
      <WindowTitle windowId={windowId} activeWindowId={activeWindowId} />
    </div>
  );
};

export default WindowHeader;
