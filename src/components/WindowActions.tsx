import { useTabSelectionContext } from '../../src/contexts/TabSelectionContext';
import { useToast } from '../../src/components/ToastProvider';
import Alert from '../../src/components/Alert';
import {
  countSelectedIds,
  shouldBulkSelectBeChecked,
  shouldCloseTabsBeDisabled,
} from '../utils/windowActions';

interface WindowActionsProps {
  windowId: number;
  visibleTabs: chrome.tabs.Tab[];
}

const extractTabIds = (tabs: chrome.tabs.Tab[]): number[] => {
  return tabs.map(tab => tab.id).filter((id): id is number => id !== undefined);
};

// visibleTabs is used to determine the checked state of the bulk select checkbox
const WindowActions = ({ windowId, visibleTabs }: WindowActionsProps) => {
  const { selectedTabIds, clearSelection, addTabsToSelection, removeTabsFromSelection } = useTabSelectionContext();
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
      showToast(<Alert message={`Selected ${tabIdsInWindow.length} tabs closed successfully.`} variant="success" />);
    } catch (error) {
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
