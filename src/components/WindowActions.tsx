import { useTabSelectionContext } from '../../src/contexts/TabSelectionContext';

interface WindowActionsProps {
  windowId: number;
  isAnyTabCheckedInGroup: boolean;
}

const WindowActions = ({ windowId, isAnyTabCheckedInGroup }: WindowActionsProps) => {
  const { selectedTabIds, clearSelection, addWindowTabsToSelection, removeWindowTabsFromSelection } =
    useTabSelectionContext();

  const handleFocusWindow = () => {
    chrome.windows.update(windowId, { focused: true });
  };

  const handleBulkSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      addWindowTabsToSelection(windowId);
    } else {
      removeWindowTabsFromSelection(windowId);
    }
  };

  const handleCloseWindow = () => {
    chrome.windows.remove(windowId);
  };

  const handleCloseTabsInWindow = async () => {
    try {
      const results = await Promise.all(
        selectedTabIds.map(async tabId => {
          try {
            const tab = await chrome.tabs.get(tabId);
            return tab.windowId === windowId ? tabId : null;
          } catch (error) {
            console.error('Error getting tab:', error);
            return null;
          }
        })
      );

      const tabIdsInWindow = results.filter((tabId): tabId is number => tabId !== null);

      await chrome.tabs.remove(tabIdsInWindow);
      clearSelection();
    } catch (error) {
      console.error('Error closing tabs:', error);
    }
  };

  return (
    <div className="window-actions-container pl-2">
      <input
        id={`bulk-select-tabs-on-window-${windowId}`}
        className="checkbox checkbox-xs"
        type="checkbox"
        onChange={handleBulkSelectChange}
        checked={isAnyTabCheckedInGroup}
      />
      <button className="btn btn-link btn-xs" onClick={handleFocusWindow}>
        Focus
      </button>
      <button className="btn btn-link btn-xs" onClick={handleCloseWindow}>
        Close Window
      </button>
      <button className="btn btn-link btn-xs" onClick={handleCloseTabsInWindow}>
        Close Tabs
      </button>
    </div>
  );
};

export default WindowActions;
