import { useTabSelectionContext } from '../../src/contexts/TabSelectionContext';
import { useDeletionState } from '../contexts/DeletionStateContext';
import { useToast } from '../../src/components/ToastProvider';
import Alert from '../../src/components/Alert';
import { countSelectedIds, shouldBulkSelectBeChecked, shouldCloseTabsBeDisabled } from '../utils/windowActions';

interface WindowActionsProps {
  windowId: number;
  visibleTabs: chrome.tabs.Tab[];
}

const extractTabIds = (tabs: chrome.tabs.Tab[]): number[] => {
  return tabs.map(tab => tab.id).filter((id): id is number => id !== undefined);
};

// visibleTabs is used to determine the checked state of the bulk select checkbox
const WindowActions = ({ windowId, visibleTabs }: WindowActionsProps) => {
  const { selectedTabIds, addTabsToSelection, removeTabsFromSelection } = useTabSelectionContext();
  const { setDeletingState } = useDeletionState();
  const { showToast } = useToast();

  const handleFocusWindow = () => {
    chrome.windows.update(windowId, { focused: true });
  };

  const handleBulkSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const visibleTabIds = extractTabIds(visibleTabs);
    if (e.target.checked) {
      addTabsToSelection(visibleTabIds);
    } else {
      removeTabsFromSelection(visibleTabIds);
    }
  };

  const handleCloseWindow = async () => {
    setDeletingState({ type: 'window', id: windowId, isDeleting: true });
    try {
      // Get all tabs in this window to remove them from selection
      const tabs = await chrome.tabs.query({ windowId });
      const tabIds = tabs.map(tab => tab.id).filter((id): id is number => id !== undefined);

      // Close the window first
      await chrome.windows.remove(windowId);

      // Remove these tabs from selection after successful close
      removeTabsFromSelection(tabIds);
    } catch (error) {
      setDeletingState({ type: 'window', id: windowId, isDeleting: false });
      console.error('Error closing window:', error);
      // Add user notification
      showToast(<Alert message="Failed to close window" variant="error" />);
    }
  };

  const handleCloseTabsInWindow = async () => {
    let tabIdsInWindow: number[] = [];
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

      tabIdsInWindow = results.filter((tabId): tabId is number => tabId !== null);

      // Mark tabs as deleting
      tabIdsInWindow.forEach(id => setDeletingState({ type: 'tab', id, isDeleting: true }));

      await chrome.tabs.remove(tabIdsInWindow);
      // Remove only the closed tabs from selection instead of clearing all
      removeTabsFromSelection(tabIdsInWindow);
      showToast(<Alert message={`Selected ${tabIdsInWindow.length} tabs closed successfully.`} variant="success" />);
    } catch (error) {
      // Reset deleting state for all tabs that failed to close
      tabIdsInWindow.forEach(id => setDeletingState({ type: 'tab', id, isDeleting: false }));
      showToast(<Alert message={`Error closing tabs: ${error instanceof Error ? error.message : String(error)}`} />);
      console.error('Error closing tabs:', error);
    }
  };

  // Calculate the number of selected tabs in this window
  const visibleTabIds = extractTabIds(visibleTabs);
  const selectedCountInWindow = countSelectedIds(visibleTabIds, selectedTabIds);

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
              checked={shouldBulkSelectBeChecked(visibleTabIds, selectedTabIds)}
            />
          </div>
          <div className="list-grow">
            <button className="btn btn-link btn-xs" onClick={handleFocusWindow}>
              Focus
            </button>
            <button className="btn btn-link btn-xs" onClick={handleCloseWindow}>
              Close Window
            </button>
            <button
              className="btn btn-link btn-xs"
              onClick={handleCloseTabsInWindow}
              disabled={shouldCloseTabsBeDisabled(visibleTabIds, selectedTabIds)}
            >
              Close Tabs
            </button>
            {selectedCountInWindow > 0 && `(${selectedCountInWindow})`}
          </div>
        </li>
      </ul>
    </>
  );
};

export default WindowActions;
