import { useState, useEffect, useRef, useMemo } from 'react';
import {
  DragEndEvent,
  DragOverEvent,
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
import { useToast } from '../components/ToastProvider';
import Alert from '../components/Alert';
import { useDragSelectionContext } from '../contexts/DragSelectionContext';
import { identifyGroupsToPreserve } from '../utils/tabGroupPreservation';
import { buildMoveSegments } from '../utils/tabMove';
import { getSortableTabData, getWindowGroupDropData } from '../types/dnd';

export interface FilteredTabGroup {
  windowId: number;
  tabs: chrome.tabs.Tab[];
  windowGroupNumber: number;
}

export interface UseTabDragAndDropResult {
  sensors: ReturnType<typeof useSensors>;
  collisionDetection: CollisionDetection;
  activeId: number | null;
  overId: number | null;
  overWindowId: number | null;
  dropPosition: 'top' | 'bottom';
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: () => void;
  activeTab: chrome.tabs.Tab | null;
  activeTabWindowTabs: chrome.tabs.Tab[];
}

export function useTabDragAndDrop(args: {
  filteredTabGroups: FilteredTabGroup[];
}): UseTabDragAndDropResult {
  const { filteredTabGroups } = args;
  const { showToast } = useToast();
  const { clearDragSelection } = useDragSelectionContext();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom'>('bottom');
  const [overWindowId, setOverWindowId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: {
        start: ['Enter'],
        cancel: ['Escape'],
        end: ['Enter'],
      },
    })
  );

  const collisionDetection: CollisionDetection = collisionArgs => {
    const pointerCollisions = pointerWithin(collisionArgs);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(collisionArgs);
  };

  // O(1) tab lookup by ID across all windows. Rebuilt only when filteredTabGroups
  // changes; drag-state re-renders reuse the same map instance.
  const allTabsMap = useMemo(
    () =>
      new Map<number, chrome.tabs.Tab>(
        // Chrome API contract: rendered tabs always have id
        filteredTabGroups.flatMap(g => g.tabs).map(t => [t.id!, t])
      ),
    [filteredTabGroups]
  );

  const sourceWindowIdRef = useRef<number | null>(null);

  // Track pointer position during drag for reliable cross-window ring highlight.
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

  // Handlers are inline (recreated every render) rather than useCallback([]) +
  // ref mirrors: closures then always capture the latest allTabsMap /
  // filteredTabGroups / dropPosition, matching the original WindowGroupList
  // behavior. dnd-kit re-reads handler props on every event, so identity
  // instability is fine.
  const onDragStart = (event: DragStartEvent) => {
    const newActiveId = Number(event.active.id);
    const activeTab = allTabsMap.get(newActiveId);
    sourceWindowIdRef.current = activeTab?.windowId ?? null;
    setActiveId(newActiveId);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Window group droppable (collapsed group or empty area) — no tab-level indicator
    if (getWindowGroupDropData(over)) {
      setOverId(null);
      return;
    }

    const activeTab = allTabsMap.get(Number(active.id));
    const overTab = allTabsMap.get(Number(over.id));

    if (activeTab && overTab) {
      setOverId(Number(over.id));

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
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const activeTab = allTabsMap.get(Number(active.id));
    if (!activeTab) return;

    // Determine target window ID + resolve drop-target tab (if any) in one lookup.
    // overTab is null iff dropped on a window-group container (collapsed group
    // header or empty area), which means "append to end of window".
    const windowGroupDrop = getWindowGroupDropData(over);
    let targetWindowId: number;
    let overTab: chrome.tabs.Tab | null = null;

    if (windowGroupDrop) {
      targetWindowId = windowGroupDrop.windowId;
    } else {
      const tab = allTabsMap.get(Number(over.id));
      if (!tab) {
        // Tab disappeared mid-drag (closed / moved by another surface).
        showToast(<Alert message="Drag target went missing, please retry" variant="error" />);
        return;
      }
      overTab = tab;
      targetWindowId = tab.windowId!;
    }

    const isCrossWindow = activeTab.windowId !== targetWindowId;

    if (!isCrossWindow) {
      // ---- Same-window move ----
      // Same-window implies non-windowGroupDrop path above, so overTab is non-null.
      if (!overTab) return;

      const windowTabs = filteredTabGroups.find(g => g.windowId === activeTab.windowId)?.tabs ?? [];

      try {
        const sortableData = getSortableTabData(active);
        const selectedItems = sortableData?.selectedItems;
        const isSelected = sortableData?.isSelected ?? false;

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
          tabsToMove = [Number(active.id)];
        }

        const groupsToPreserve = identifyGroupsToPreserve(tabsToMove, windowTabs);

        if (groupsToPreserve.length > 0) {
          // Segment-based move: use chrome.tabGroups.move() for groups to avoid
          // chrome.tabs.move() breaking group membership.
          const preservedGroupIds = new Set(groupsToPreserve.map(g => g.groupId));
          const tabMap = new Map(windowTabs.map(t => [t.id!, t]));
          const segments = buildMoveSegments(tabsToMove, tabMap, preservedGroupIds);

          // Step 1: Collect all segments at end of window (preserves relative order)
          for (const seg of segments) {
            if (seg.type === 'group') {
              await chrome.tabGroups.move(seg.groupId, { index: -1 });
            } else {
              await chrome.tabs.move(seg.tabIds, { index: -1 });
            }
          }

          // Step 2: Get drop target's current index (shifted after collection)
          const overTabNow = await chrome.tabs.get(overTab.id!);
          let insertAt = overTabNow.index;
          if (dropPosition === 'bottom') insertAt++;

          // Step 3: Move segments from end to target position in order
          let offset = 0;
          for (const seg of segments) {
            if (seg.type === 'group') {
              await chrome.tabGroups.move(seg.groupId, { index: insertAt + offset });
            } else {
              await chrome.tabs.move(seg.tabIds, { index: insertAt + offset });
            }
            offset += seg.tabIds.length;
          }
        } else {
          // No groups to preserve — sequential move with direction-aware index
          const selectedIndices = tabsToMove
            .map(id => windowTabs.find(t => t.id === id)?.index)
            .filter((index): index is number => index !== undefined);
          const minSelectedIndex = Math.min(...selectedIndices);

          let targetIndex = overTab.index;
          if (dropPosition === 'bottom') targetIndex++;

          const isMovingDown = minSelectedIndex < targetIndex;
          if (isMovingDown) targetIndex -= tabsToMove.length;

          if (tabsToMove.length === 1) {
            await chrome.tabs.move(tabsToMove[0], { index: targetIndex });
          } else {
            if (isMovingDown) {
              // Downward: move in reverse order (last tab first)
              for (let i = tabsToMove.length - 1; i >= 0; i--) {
                await chrome.tabs.move(tabsToMove[i], { index: targetIndex + i });
              }
            } else {
              // Upward: move in forward order (first tab first)
              for (let i = 0; i < tabsToMove.length; i++) {
                await chrome.tabs.move(tabsToMove[i], { index: targetIndex + i });
              }
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
      const sortableData = getSortableTabData(active);
      const selectedItems = sortableData?.selectedItems;
      const isSelected = sortableData?.isSelected ?? false;

      // Calculate target index from overTab (null iff dropped on window-group container)
      const targetIndex =
        overTab === null ? -1 : dropPosition === 'top' ? overTab.index : overTab.index + 1;

      const sourceWindowTabs =
        filteredTabGroups.find(g => g.windowId === activeTab.windowId)?.tabs ?? [];

      let tabsToMove: number[];

      if (isSelected && selectedItems && selectedItems.length > 1) {
        // Multi-tab cross-window move
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
        tabsToMove = [Number(active.id)];
      }

      try {
        const groupsToPreserve = identifyGroupsToPreserve(tabsToMove, sourceWindowTabs);

        if (groupsToPreserve.length > 0) {
          // Segment-based cross-window move: use chrome.tabGroups.move() for groups
          const preservedGroupIds = new Set(groupsToPreserve.map(g => g.groupId));
          const tabMap = new Map(sourceWindowTabs.map(t => [t.id!, t]));
          const segments = buildMoveSegments(tabsToMove, tabMap, preservedGroupIds);

          // Step 1: Move all segments to target window (append to end)
          for (const seg of segments) {
            if (seg.type === 'group') {
              await chrome.tabGroups.move(seg.groupId, {
                windowId: targetWindowId,
                index: -1,
              });
            } else {
              await chrome.tabs.move(seg.tabIds, {
                windowId: targetWindowId,
                index: -1,
              });
            }
          }

          // Step 2: Reposition within target window if dropped on a specific tab
          if (overTab) {
            const overTabNow = await chrome.tabs.get(overTab.id!);
            let insertAt = overTabNow.index;
            if (dropPosition === 'bottom') insertAt++;

            let offset = 0;
            for (const seg of segments) {
              if (seg.type === 'group') {
                await chrome.tabGroups.move(seg.groupId, { index: insertAt + offset });
              } else {
                await chrome.tabs.move(seg.tabIds, { index: insertAt + offset });
              }
              offset += seg.tabIds.length;
            }
          }
        } else {
          // No groups to preserve — existing two-step move
          await chrome.tabs.move(tabsToMove, { windowId: targetWindowId, index: -1 });
          if (targetIndex !== -1) {
            await chrome.tabs.move(tabsToMove, { index: targetIndex });
          }
        }

        clearDragSelection();
      } catch (error) {
        showToast(<Alert message="Failed to move tab to another window" variant="error" />);
        console.error('Error moving tab(s) to another window:', error);
      }
    }
  };

  const onDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  const activeTab = activeId !== null ? (allTabsMap.get(activeId) ?? null) : null;
  const activeTabWindowTabs = activeTab
    ? (filteredTabGroups.find(g => g.windowId === activeTab.windowId)?.tabs ?? [])
    : [];

  return {
    sensors,
    collisionDetection,
    activeId,
    overId,
    overWindowId,
    dropPosition,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
    activeTab,
    activeTabWindowTabs,
  };
}
