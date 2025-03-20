interface WindowActionsProps {
  windowId: number;
}

const WindowActions = ({ windowId }: WindowActionsProps) => {
  const handleFocusWindow = () => {
    chrome.windows.update(windowId, { focused: true });
  };

  const handleCloseWindow = () => {
    chrome.windows.remove(windowId);
  };

  return (
    <div className="window-actions-container">
      <button className="btn btn-link btn-xs" onClick={handleFocusWindow}>
        Focus
      </button>
      <button className="btn btn-link btn-xs" onClick={handleCloseWindow}>
        Close
      </button>
    </div>
  );
};

export default WindowActions;
