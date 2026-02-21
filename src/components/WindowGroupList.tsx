import { useState, useEffect, useRef } from 'react';
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
  pointerWithin,
  rectIntersection,
  CollisionDetection,
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
  isFiltered?: boolean;
}

const WindowGroupList = ({ filteredTabGroups, isFiltered = false }: WindowGroupListProps) => {
  const { showToast } = useToast();
  const { clearDragSelection, dragSelectedTabIds } = useDragSelectionContext();

  // Track active dragging item for DragOverlay
  const [activeId, setActiveId] = useState<number | null>(null);

  // Track drop indicator position
  const [overId, setOverId] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom'>('bottom');

  // Track which window group is being dragged over (for cross-window ring highlight)
  const [overWindowId, setOverWindowId] = useState<number | null>(null);

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

  // Pointer-first collision detection for multi-container DnD
  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  };

  // All tabs across all windows (for lookups)
  const allTabs = filteredTabGroups.flatMap(g => g.tabs);

  // Store source window ID for pointer tracking (set in handleDragStart, read in useEffect)
  const sourceWindowIdRef = useRef<number | null>(null);

  // Track pointer position during drag for reliable ring highlight.
  // Uses DOM elementsFromPoint() instead of dnd-kit collision detection to avoid
  // flickering caused by rectIntersection fallback matching adjacent window groups.
  useEffect(() => {
    if (activeId === null) return;

    const sourceWindowId = sourceWindowIdRef.current;

    const handlePointerMove = (e: PointerEvent) => {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const windowGroupEl = elements.find(
        (el): el is HTMLElement => el instanceof HTMLElement && 'windowId' in el.dataset
      );
      if (windowGroupEl) {
        const targetWindowId = Number(windowGroupEl.dataset.windowId);
        setOverWindowId(targetWindowId !== sourceWindowId ? targetWindowId : null);
      } else {
        setOverWindowId(null);
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      setOverWindowId(null);
    };
  }, [activeId]);

  // Handle drag start to track active item for DragOverlay
  const handleDragStart = (event: DragStartEvent) => {
    const newActiveId = event.active.id as number;
    const activeTab = allTabs.find(t => t.id === newActiveId);
    sourceWindowIdRef.current = activeTab?.windowId ?? null;
    setActiveId(newActiveId);
  };

  // Handle drag over event to show drop indicator
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (over) {
      // Window group droppable (collapsed group or empty area) — no tab-level indicator
      if (over.data.current?.type === 'window-group') {
        setOverId(null);
        return;
      }

      const activeTab = allTabs.find(t => t.id === active.id);
      const overTab = allTabs.find(t => t.id === over.id);

      if (activeTab && overTab) {
        setOverId(over.id as number);

        if (activeTab.windowId === overTab.windowId) {
          // Same window: direction based on index comparison
          const position = activeTab.index > overTab.index ? 'top' : 'bottom';
          setDropPosition(position);
        } else {
          // Cross-window: always insert after the over tab
          setDropPosition('bottom');
        }
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

    const activeTab = allTabs.find(t => t.id === active.id);
    if (!activeTab) return;

    // Determine target window ID based on drop target type
    const isWindowGroupDrop = over.data.current?.type === 'window-group';
    let targetWindowId: number;

    if (isWindowGroupDrop) {
      // Dropped on a window group container (e.g., collapsed group header)
      targetWindowId = over.data.current!.windowId as number;
    } else {
      // Dropped on a specific tab
      const overTab = allTabs.find(t => t.id === over.id);
      if (!overTab) {
        console.error('Drop target tab not found:', over.id);
        return;
      }
      targetWindowId = overTab.windowId!;
    }

    const isCrossWindow = activeTab.windowId !== targetWindowId;

    if (!isCrossWindow) {
      // ---- Same-window move (existing logic) ----
      const overTab = allTabs.find(t => t.id === over.id);
      if (!overTab) return;

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
    } else {
      // ---- Cross-window move ----

      // Get drag selection data from useSortable
      const selectedItems = active.data.current?.selectedItems as number[] | undefined;
      const isSelected = active.data.current?.isSelected as boolean;

      // Calculate target index
      let targetIndex: number;
      if (isWindowGroupDrop) {
        // Dropped on window group container (collapsed group) — append to end
        targetIndex = -1;
      } else {
        // Dropped on a specific tab in the target window
        const overTab = allTabs.find(t => t.id === over.id)!;
        targetIndex = dropPosition === 'top' ? overTab.index : overTab.index + 1;
      }

      // Determine which tabs to move (sorted by index for relative order)
      let tabsToMove: number[];

      if (isSelected && selectedItems && selectedItems.length > 1) {
        // Multi-tab cross-window move
        const sourceWindowTabs = filteredTabGroups.find(g => g.windowId === activeTab.windowId)?.tabs ?? [];
        tabsToMove = selectedItems
          .map(id => {
            const tab = sourceWindowTabs.find(t => t.id === id);
            return tab ? { id, index: tab.index } : null;
          })
          .filter((item): item is { id: number; index: number } => item !== null)
          .sort((a, b) => a.index - b.index)
          .map(item => item.id);
      } else {
        // Single-tab cross-window move
        tabsToMove = [active.id as number];
      }

      try {
        // Two-step move: first append all tabs to target window, then reposition.
        // Batch API calls (chrome.tabs.move accepts an array) to minimize events and debounce delay.
        // Step 1: Append all tabs to target window (preserves relative order)
        await chrome.tabs.move(tabsToMove, { windowId: targetWindowId, index: -1 });

        // Step 2: Reposition within target window if dropped on a specific tab
        if (targetIndex !== -1) {
          await chrome.tabs.move(tabsToMove, { index: targetIndex });
        }

        clearDragSelection();
      } catch (error) {
        showToast(<Alert message="Failed to move tab to another window" variant="error" />);
        console.error('Error moving tab(s) to another window:', error);
      }
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
      collisionDetection={collisionDetection}
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
                  isFiltered={isFiltered}
                  overId={overId}
                  dropPosition={dropPosition}
                  overWindowId={overWindowId}
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
                  {/* Show badge with selection count during multi-drag */}
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
