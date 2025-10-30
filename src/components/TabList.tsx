import React, { useRef, useState } from 'react';
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
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import TabItem from './TabItem';
import { useToast } from './ToastProvider';
import Alert from './Alert';
import { useDragSelectionContext } from '../contexts/DragSelectionContext';

interface TabListProps {
  tabs: chrome.tabs.Tab[];
  isFiltered?: boolean;
}

const TabList = ({ tabs, isFiltered = false }: TabListProps) => {
  const listRef = useRef<HTMLUListElement>(null);
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

  // Handle drag start to track active item for DragOverlay
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  // Handle drag over event to show drop indicator
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (over) {
      setOverId(over.id as number);

      // Use actual browser tab indices (not array positions) for consistent behavior
      const activeTab = tabs.find(t => t.id === active.id);
      const overTab = tabs.find(t => t.id === over.id);

      if (activeTab && overTab) {
        const position = activeTab.index > overTab.index ? 'top' : 'bottom';
        setDropPosition(position);
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

    // Find target tab and use its actual browser index (not array position)
    const overTab = tabs.find(t => t.id === over.id);
    if (!overTab) {
      console.error('Drop target tab not found:', over.id);
      return;
    }
    const newIndex = overTab.index;

    try {
      // Get drag selection data from useSortable
      const selectedItems = active.data.current?.selectedItems as number[] | undefined;
      const isSelected = active.data.current?.isSelected as boolean;

      // Determine which tabs to move
      let tabsToMove: number[];

      if (isSelected && selectedItems) {
        // Sort selected tab IDs by their current browser position to preserve original order
        // Example: Cmd+click tabs 1,3,5 → always move as [1,3,5], not [5,1,3]
        tabsToMove = selectedItems
          .map(id => {
            const tab = tabs.find(t => t.id === id);
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
        .map(id => tabs.find(t => t.id === id)?.index)
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
        // Moving downward: subtract the number of tabs being moved
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
      // (If selected tab was dragged, keep selection for consecutive moves)
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const activeElement = document.activeElement;
    if (!activeElement || !listRef.current?.contains(activeElement)) {
      return;
    }

    const tabItems = Array.from(listRef.current!.querySelectorAll('li[tabindex="0"]')) as HTMLElement[];
    const activeIndex = tabItems.indexOf(activeElement as HTMLElement);

    if (activeIndex === -1) {
      return;
    }

    let nextIndex = -1;

    switch (event.key) {
      case 'k':
        nextIndex = (activeIndex - 1 + tabItems.length) % tabItems.length;
        break;
      case 'j':
        nextIndex = (activeIndex + 1) % tabItems.length;
        break;
      case 'H':
        if (event.shiftKey) {
          nextIndex = 0;
        }
        break;
      case 'M':
        if (event.shiftKey && tabItems.length >= 3) {
          nextIndex = Math.floor(tabItems.length / 2);
        }
        break;
      case 'L':
        if (event.shiftKey) {
          nextIndex = tabItems.length - 1;
        }
        break;
    }

    if (nextIndex !== -1) {
      event.preventDefault();
      (tabItems[nextIndex] as HTMLElement).focus();
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={tabs.map(t => t.id!)} strategy={verticalListSortingStrategy} disabled={isFiltered}>
        <ul ref={listRef} className="list shadow-md" onKeyDown={handleKeyDown}>
          {tabs.map((tab, index) => (
            <div key={tab.id}>
              {/* Top drop indicator */}
              <div
                className={`h-0.5 bg-info transition-opacity ${
                  overId === tab.id && dropPosition === 'top' ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <TabItem tab={tab} isFiltered={isFiltered} index={index} windowId={tab.windowId!} tabs={tabs} />
              {/* Bottom drop indicator */}
              <div
                className={`h-0.5 bg-info transition-opacity ${
                  overId === tab.id && dropPosition === 'bottom' ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          ))}
        </ul>
      </SortableContext>

      {/* DragOverlay shows clone of dragged item with optional selection badge */}
      <DragOverlay>
        {activeId
          ? (() => {
              const activeTab = tabs.find(t => t.id === activeId);
              if (!activeTab) return null;

              return (
                <div className="relative">
                  <ul className="list shadow-md">
                    <TabItem
                      tab={activeTab}
                      isFiltered={false}
                      index={tabs.findIndex(t => t.id === activeId)}
                      windowId={activeTab.windowId!}
                      tabs={tabs}
                    />
                  </ul>
                  {/* Show badge when dragging multiple selected tabs */}
                  {dragSelectedTabIds.has(activeId) && dragSelectedTabIds.size > 1 && (
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

export default TabList;
