import { useTabSelectionContext } from '../../src/contexts/TabSelectionContext';
import { useToast } from '../../src/components/ToastProvider';
import Alert from '../../src/components/Alert';

interface WindowActionsProps {
  windowId: number;
  isAnyTabCheckedInGroup: boolean; // This will be re-calculated based on visibleTabs
  visibleTabs: chrome.tabs.Tab[];
}

const WindowActions = ({ windowId, visibleTabs }: WindowActionsProps) => {
  const {
    selectedTabIds,
    clearSelection,
    // addWindowTabsToSelection, // No longer used directly for bulk select
    // removeWindowTabsFromSelection, // No longer used directly for bulk select
    addTabsToSelection,
    removeTabsFromSelection,
  } = useTabSelectionContext();
  const { showToast } = useToast();

  const handleFocusWindow = () => {
    chrome.windows.update(windowId, { focused: true });
  };

  const handleBulkSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const visibleTabIds = visibleTabs.map(tab => tab.id).filter((id): id is number => id !== undefined);
    if (e.target.checked) {
      addTabsToSelection(visibleTabIds);
    } else {
      removeTabsFromSelection(visibleTabIds);
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
      showToast(<Alert message="Selected tabs closed successfully." />);
    } catch (error) {
      showToast(<Alert message={`Error closing tabs: ${error instanceof Error ? error.message : String(error)}`} />);
      console.error('Error closing tabs:', error);
    }
  };

  return (
    <>
      <ul className="list shadow-md">
        <li className="list-row p-2 items-center rounded-none gap-1.5">
          <div>
            <input
              id={`bulk-select-tabs-on-window-${windowId}`}
              className="checkbox checkbox-xs"
              type="checkbox"
              onChange={handleBulkSelectChange}
              checked={
                visibleTabs.length > 0 &&
                visibleTabs.every(tab => tab.id !== undefined && selectedTabIds.includes(tab.id))
              }
            />
          </div>
          <div className="list-grow">
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
        </li>
      </ul>
    </>
  );
};

export default WindowActions;
