import React from 'react';
import WindowTitle from './WindowTitle';
import WindowActions from './WindowActions';

interface WindowHeaderProps {
  windowId: number;
  activeWindowId: number | null;
}

const WindowHeader = ({ windowId, activeWindowId }: WindowHeaderProps) => {
  return (
    <div className="window-header">
      <WindowTitle windowId={windowId} activeWindowId={activeWindowId} />
      <WindowActions windowId={windowId} />
    </div>
  );
};

export default WindowHeader;
