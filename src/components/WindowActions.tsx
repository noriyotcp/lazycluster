import React from 'react';

interface WindowActionsProps {
  windowId: number;
}

const WindowActions: React.FC<WindowActionsProps> = ({ windowId }) => {
  const handleFocusWindow = () => {
    chrome.windows.update(windowId, { focused: true });
  };

  const handleCloseWindow = () => {
    chrome.windows.remove(windowId);
  };

  return (
    <div className="window-actions-container">
      <button onClick={handleFocusWindow}>Focus</button>
      <button onClick={handleCloseWindow}>Close</button>
    </div>
  );
};

export default WindowActions;
