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

interface TabListProps {
  tabs: chrome.tabs.Tab[];
  isFiltered?: boolean;
}

const TabList = ({ tabs, isFiltered = false }: TabListProps) => {
  const listRef = useRef<HTMLUListElement>(null);
  const { showToast } = useToast();

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

      // Determine drop position based on active and over indices
      const activeIndex = tabs.findIndex(t => t.id === active.id);
      const overIndex = tabs.findIndex(t => t.id === over.id);

      setDropPosition(activeIndex > overIndex ? 'top' : 'bottom');
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

    // Find target index in current window's tabs
    const newIndex = tabs.findIndex(t => t.id === over.id);

    try {
      // Move tab within same window (windowId omitted = current window)
      await chrome.tabs.move(active.id as number, { index: newIndex });
    } catch (error) {
      showToast(<Alert message="Failed to move tab" variant="error" />);
      console.error('Error moving tab:', error);
    }
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
    >
      <SortableContext items={tabs.map(t => t.id!)} strategy={verticalListSortingStrategy} disabled={isFiltered}>
        <ul ref={listRef} className="list shadow-md" onKeyDown={handleKeyDown}>
          {tabs.map(tab => (
            <div key={tab.id}>
              {/* Top drop indicator */}
              <div
                className={`h-0.5 bg-info transition-opacity ${
                  overId === tab.id && dropPosition === 'top' ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <TabItem tab={tab} isFiltered={isFiltered} />
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

      {/* DragOverlay shows clone of dragged item */}
      <DragOverlay>
        {activeId ? (
          <ul className="list shadow-md">
            <TabItem tab={tabs.find(t => t.id === activeId)!} isFiltered={false} />
          </ul>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TabList;
