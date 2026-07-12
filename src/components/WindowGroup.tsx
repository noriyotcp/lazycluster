import { memo, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import WindowHeader from './WindowHeader';
import TabList from './TabList';
import WindowActions from './WindowActions';
import { useWindowGroupContext } from '../contexts/WindowGroupContext';
import { useDeletionState } from '../contexts/DeletionStateContext';
import { useRingHighlight } from '../contexts/DragStateContexts';
import { toggleAllWindowGroupCollapses } from '../utils/windowGroupCollapse';
import type { WindowGroupDropData } from '../types/dnd';

interface WindowGroupProps {
  tabGroup: {
    windowId: number;
    tabs: chrome.tabs.Tab[];
  };
  isFiltered?: boolean;
}

interface WindowGroupContentProps {
  windowId: number;
  windowGroupNumber: number;
  isFiltered: boolean;
  tabs: chrome.tabs.Tab[];
  active: boolean;
}

const WindowGroupContent = memo(
  ({ windowId, windowGroupNumber, isFiltered, tabs, active }: WindowGroupContentProps) => {
    const handleCollapseClick = useCallback((event: React.MouseEvent<HTMLInputElement>) => {
      if (event.altKey) {
        // The checkbox has already toggled by the time onClick fires.
        // Read the new state and apply it to ALL window groups.
        const targetChecked = event.currentTarget.checked;
        toggleAllWindowGroupCollapses(targetChecked);
      }
    }, []);

    return (
      <div
        className={`collapse collapse-arrow bg-base-100 border-base-300 border rounded-none mb-4 ${active ? 'ring-2 ring-accent' : ''}`}
        data-window-group-number={windowGroupNumber}
        data-window-id={windowId}
      >
        <input
          id={`window-group-collapse-${windowId}`}
          type="checkbox"
          defaultChecked={true}
          onClick={handleCollapseClick}
        />
        <div className="collapse-title font-semibold">
          <WindowHeader windowId={windowId} />
        </div>
        <div className="collapse-content">
          <WindowActions windowId={windowId} visibleTabs={tabs} />
          <TabList tabs={tabs} isFiltered={isFiltered} />
        </div>
      </div>
    );
  }
);
WindowGroupContent.displayName = 'WindowGroupContent';

const WindowGroup = ({ tabGroup, isFiltered = false }: WindowGroupProps) => {
  const overWindowId = useRingHighlight();
  const windowGroupNumber = useWindowGroupContext();
  const { isDeleting } = useDeletionState();
  const isDeletingWindow = isDeleting({ type: 'window', id: tabGroup.windowId });
  const active = overWindowId === tabGroup.windowId;

  // Register as a drop zone for cross-window drag-and-drop. useDroppable
  // subscribes to DndContext, so this outer wrapper re-renders on drag ticks —
  // that's why the actual content is split into a memoized child.
  const { setNodeRef } = useDroppable({
    id: `window-${tabGroup.windowId}`,
    data: { windowId: tabGroup.windowId, type: 'window-group' } satisfies WindowGroupDropData,
  });

  return (
    <div ref={setNodeRef} inert={isDeletingWindow || undefined} className="inert:opacity-50">
      <WindowGroupContent
        windowId={tabGroup.windowId}
        windowGroupNumber={windowGroupNumber}
        isFiltered={isFiltered}
        tabs={tabGroup.tabs}
        active={active}
      />
    </div>
  );
};

export default WindowGroup;
