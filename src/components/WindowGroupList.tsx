import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import WindowGroup from './WindowGroup';
import TabItem from './TabItem';
import { WindowGroupContextProvider } from '../contexts/WindowGroupContext';
import { useToast } from './ToastProvider';
import Alert from './Alert';
import { useDragSelectionContext } from '../contexts/DragSelectionContext';

interface WindowGroupListProps {
  filteredTabGroups: { windowId: number; tabs: chrome.tabs.Tab[]; windowGroupNumber: number }[];
  activeWindowId: number | null;
  isFiltered?: boolean;
}

const WindowGroupList = ({ filteredTabGroups, activeWindowId, isFiltered = false }: WindowGroupListProps) => {
  const { showToast } = useToast();
  const { clearDragSelection, dragSelectedTabIds } = useDragSelectionContext();

  // Track active dragging item for DragOverlay
  const [activeId, setActiveId] = useState<number | null>(null);

  // Track drop indicator position
  const [overId, setOverId] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom'>('bottom');

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // Prevent accidental drags
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: {
        start: ['Enter'], // Only Enter key activates drag (Space is reserved for checkbox toggle)
        cancel: ['Escape'],
        end: ['Enter'],
      },
    })
  );

  // All tabs across all windows (for lookups)
  const allTabs = filteredTabGroups.flatMap(g => g.tabs);

  // Handle drag start to track active item for DragOverlay
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  // Handle drag over event to show drop indicator
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (over) {
      const activeTab = allTabs.find(t => t.id === active.id);
      const overTab = allTabs.find(t => t.id === over.id);

      // Only show drop indicator for same-window targets (cross-window in later steps)
      if (activeTab && overTab && activeTab.windowId === overTab.windowId) {
        setOverId(over.id as number);

        // Use actual browser tab indices (not array positions) for consistent behavior
        const position = activeTab.index > overTab.index ? 'top' : 'bottom';
        setDropPosition(position);
      } else {
        setOverId(null);
      }
    }
  };

  // Handle drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // Reset drag overlay and drop indicator
    setActiveId(null);
    setOverId(null);

    // Early return: no drop target or dropped on itself
    if (!over || active.id === over.id) return;

    // Find tabs involved
    const activeTab = allTabs.find(t => t.id === active.id);
    const overTab = allTabs.find(t => t.id === over.id);

    if (!activeTab || !overTab) {
      console.error('Drop target tab not found:', over.id);
      return;
    }

    // Step 1: only handle same-window moves (cross-window in Step 4)
    if (activeTab.windowId !== overTab.windowId) return;

    // Get the window's tabs for index calculations
    const windowTabs = filteredTabGroups.find(g => g.windowId === activeTab.windowId)?.tabs ?? [];
    const newIndex = overTab.index;

    try {
      // Get drag selection data from useSortable
      const selectedItems = active.data.current?.selectedItems as number[] | undefined;
      const isSelected = active.data.current?.isSelected as boolean;

      // Determine which tabs to move
      let tabsToMove: number[];

      if (isSelected && selectedItems) {
        // Sort selected tab IDs by their current browser position to preserve original order
        tabsToMove = selectedItems
          .map(id => {
            const tab = windowTabs.find(t => t.id === id);
            return tab ? { id, index: tab.index } : null;
          })
          .filter((item): item is { id: number; index: number } => item !== null)
          .sort((a, b) => a.index - b.index)
          .map(item => item.id);
      } else {
        tabsToMove = [active.id as number];
      }

      // Calculate minimum index of selected tabs for direction detection
      const selectedIndices = tabsToMove
        .map(id => windowTabs.find(t => t.id === id)?.index)
        .filter((index): index is number => index !== undefined);
      const minSelectedIndex = Math.min(...selectedIndices);

      // Calculate target index based on drop position
      let targetIndex = newIndex;
      if (dropPosition === 'bottom') {
        targetIndex++;
      }

      // Determine direction BEFORE adjustment (use minimum selected index, not active tab)
      const isMovingDown = minSelectedIndex < targetIndex;

      // Adjust for downward movement: when moving tab(s) down, they're removed first,
      // shifting all subsequent tabs' indices by the number of tabs being moved
      if (isMovingDown) {
        targetIndex -= tabsToMove.length;
      }

      // Move tab(s) within same window (windowId omitted = current window)
      if (tabsToMove.length === 1) {
        await chrome.tabs.move(tabsToMove[0], { index: targetIndex });
      } else {
        if (isMovingDown) {
          // Downward: move in reverse order (last tab first)
          for (let i = tabsToMove.length - 1; i >= 0; i--) {
            const tabId = tabsToMove[i];
            const finalIndex = targetIndex + i;
            await chrome.tabs.move(tabId, { index: finalIndex });
          }
        } else {
          // Upward: move in forward order (first tab first)
          for (let i = 0; i < tabsToMove.length; i++) {
            const tabId = tabsToMove[i];
            const finalIndex = targetIndex + i;
            await chrome.tabs.move(tabId, { index: finalIndex });
          }
        }
      }

      // Clear drag selection only if dragged tab was NOT selected
      if (!isSelected) {
        clearDragSelection();
      }
    } catch (error) {
      showToast(<Alert message="Failed to move tab" variant="error" />);
      console.error('Error moving tab:', error);
    }
  };

  // Handle drag cancel event (e.g., ESC key pressed)
  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  // Find active tab data for DragOverlay
  const activeTab = activeId ? allTabs.find(t => t.id === activeId) : null;
  const activeTabWindowTabs = activeTab
    ? filteredTabGroups.find(g => g.windowId === activeTab.windowId)?.tabs ?? []
    : [];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="lg:columns-2 mt-4">
        {filteredTabGroups
          .filter(group => group.tabs.length > 0)
          .map(tabGroup => (
            <div key={tabGroup.windowId} className="break-inside-avoid-column">
              <WindowGroupContextProvider key={tabGroup.windowId} value={{ windowGroupNumber: tabGroup.windowGroupNumber }}>
                <WindowGroup
                  tabGroup={tabGroup}
                  activeWindowId={activeWindowId}
                  isFiltered={isFiltered}
                  overId={overId}
                  dropPosition={dropPosition}
                />
              </WindowGroupContextProvider>
            </div>
          ))}
      </div>

      {/* DragOverlay shows clone of dragged item with optional selection badge */}
      <DragOverlay>
        {activeTab
          ? (() => {
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
                  {/* Show badge when dragging multiple selected tabs */}
                  {dragSelectedTabIds.has(activeId!) && dragSelectedTabIds.size > 1 && (
                    <div className="absolute -top-2 -right-2 badge badge-sm badge-accent">
                      {dragSelectedTabIds.size}
                    </div>
                  )}
                </div>
              );
            })()
          : null}
      </DragOverlay>
    </DndContext>
  );
};

export default WindowGroupList;
