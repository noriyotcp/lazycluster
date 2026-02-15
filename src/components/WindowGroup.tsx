import { useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
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
  overId: number | null;
  dropPosition: 'top' | 'bottom';
  overWindowId: number | null;
}
const WindowGroup = ({ tabGroup, activeWindowId, isFiltered = false, overId, dropPosition, overWindowId }: WindowGroupProps) => {
  const { windowGroupNumber } = useWindowGroupContext();
  const { isDeleting } = useDeletionState();
  const isDeletingWindow = isDeleting({ type: 'window', id: tabGroup.windowId });

  // Register as a drop zone for cross-window drag-and-drop
  const { setNodeRef } = useDroppable({
    id: `window-${tabGroup.windowId}`,
    data: { windowId: tabGroup.windowId, type: 'window-group' },
  });

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
    <div ref={setNodeRef} inert={isDeletingWindow || undefined} className="inert:opacity-50">
      <div
        className={`collapse collapse-arrow bg-base-100 border-base-300 border rounded-none mb-4 ${overWindowId === tabGroup.windowId ? 'ring-2 ring-accent' : ''}`}
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
          <TabList tabs={tabGroup.tabs} isFiltered={isFiltered} overId={overId} dropPosition={dropPosition} />
        </div>
      </div>
    </div>
  );
};

export default WindowGroup;
