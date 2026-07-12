import { DndContext, DragOverlay, MeasuringStrategy } from '@dnd-kit/core';
import WindowGroup from './WindowGroup';
import TabDragOverlay from './TabDragOverlay';
import { WindowGroupContextProvider } from '../contexts/WindowGroupContext';
import { DragStateProvider } from '../contexts/DragStateContexts';
import { useTabDragAndDrop, type FilteredTabGroup } from '../hooks/useTabDragAndDrop';

interface WindowGroupListProps {
  filteredTabGroups: FilteredTabGroup[];
  isFiltered?: boolean;
}

const WindowGroupList = ({ filteredTabGroups, isFiltered = false }: WindowGroupListProps) => {
  const {
    sensors,
    collisionDetection,
    overId,
    overWindowId,
    dropPosition,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
    activeTab,
    activeTabWindowTabs,
  } = useTabDragAndDrop({ filteredTabGroups });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
      measuring={{ droppable: { strategy: MeasuringStrategy.BeforeDragging } }}
    >
      <DragStateProvider overWindowId={overWindowId} overId={overId} dropPosition={dropPosition}>
        <div className="lg:columns-2 mt-4">
          {filteredTabGroups
            .filter(group => group.tabs.length > 0)
            .map(tabGroup => (
              <div key={tabGroup.windowId} className="break-inside-avoid-column">
                <WindowGroupContextProvider key={tabGroup.windowId} value={tabGroup.windowGroupNumber}>
                  <WindowGroup tabGroup={tabGroup} isFiltered={isFiltered} />
                </WindowGroupContextProvider>
              </div>
            ))}
        </div>
      </DragStateProvider>

      <DragOverlay>
        {activeTab ? <TabDragOverlay activeTab={activeTab} activeTabWindowTabs={activeTabWindowTabs} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default WindowGroupList;
