import TabItem from './TabItem';
import { useDragSelectionContext } from '../contexts/DragSelectionContext';

interface TabDragOverlayProps {
  activeTab: chrome.tabs.Tab;
  activeTabWindowTabs: chrome.tabs.Tab[];
}

// Rendered inside <DragOverlay> as the drag preview clone. Not a Sortable —
// receives `tabs`/`index` only for downstream props parity with in-list TabItem.
const TabDragOverlay = ({ activeTab, activeTabWindowTabs }: TabDragOverlayProps) => {
  const { dragSelectedTabIds } = useDragSelectionContext();
  const activeId = activeTab.id!;
  const showBadge = dragSelectedTabIds.has(activeId) && dragSelectedTabIds.size > 1;

  return (
    <div className="relative">
      <ul className="list shadow-md">
        <TabItem
          tab={activeTab}
          isFiltered={false}
          index={activeTabWindowTabs.findIndex(t => t.id === activeId)}
          windowId={activeTab.windowId!}
          tabs={activeTabWindowTabs}
        />
      </ul>
      {showBadge && (
        <div className="absolute -top-2 -right-2 badge badge-sm badge-accent">{dragSelectedTabIds.size}</div>
      )}
    </div>
  );
};

export default TabDragOverlay;
