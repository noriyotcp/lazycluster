import { useCallback } from 'react';
import WindowHeader from './WindowHeader';
import TabList from './TabList';
import WindowActions from './WindowActions';
import { useWindowGroupContext } from '../contexts/WindowGroupContext';
import { useDeletionState } from '../contexts/DeletionStateContext';
import { toggleAllWindowGroupCollapses } from '../utils/windowGroupCollapse';

interface WindowGroupProps {
  tabGroup: {
    windowId: number;
    tabs: chrome.tabs.Tab[];
  };
  activeWindowId: number | null;
  isFiltered?: boolean;
}
const WindowGroup = ({ tabGroup, activeWindowId, isFiltered = false }: WindowGroupProps) => {
  const { windowGroupNumber } = useWindowGroupContext();
  const { isDeleting } = useDeletionState();
  const isDeletingWindow = isDeleting({ type: 'window', id: tabGroup.windowId });

  const handleCollapseClick = useCallback(
    (event: React.MouseEvent<HTMLInputElement>) => {
      if (event.altKey) {
        // The checkbox has already toggled by the time onClick fires.
        // Read the new state and apply it to ALL window groups.
        const targetChecked = event.currentTarget.checked;
        toggleAllWindowGroupCollapses(targetChecked);
      }
    },
    []
  );

  return (
    <div inert={isDeletingWindow || undefined} className="inert:opacity-50">
      <div
        className="collapse collapse-arrow bg-base-100 border-base-300 border rounded-none mb-4"
        data-window-group-number={windowGroupNumber}
        data-window-id={tabGroup.windowId}
      >
        <input
          id={`window-group-collapse-${tabGroup.windowId}`}
          type="checkbox"
          defaultChecked={true}
          onClick={handleCollapseClick}
        />
        <div className="collapse-title font-semibold">
          <WindowHeader windowId={tabGroup.windowId} activeWindowId={activeWindowId} />
        </div>
        <div className="collapse-content">
          <WindowActions windowId={tabGroup.windowId} visibleTabs={tabGroup.tabs} />
          <TabList tabs={tabGroup.tabs} isFiltered={isFiltered} />
        </div>
      </div>
    </div>
  );
};

export default WindowGroup;
