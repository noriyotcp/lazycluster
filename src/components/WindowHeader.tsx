import React from 'react';
import WindowTitle from './WindowTitle';
import WindowActions from './WindowActions';

interface WindowHeaderProps {
  windowId: number;
  activeWindowId: number | null;
  sequenceNumber: number;
}

const WindowHeader = ({ windowId, activeWindowId, sequenceNumber }: WindowHeaderProps) => (
  <div className="window-header-container">
    <WindowTitle windowId={windowId} activeWindowId={activeWindowId} sequenceNumber={sequenceNumber} />
    <WindowActions windowId={windowId} />
  </div>
);

export default WindowHeader;
