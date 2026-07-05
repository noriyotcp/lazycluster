import type { Active, Over } from '@dnd-kit/core';

/**
 * Payloads attached to dnd-kit draggable/droppable entries. dnd-kit exposes
 * them back as untyped `data.current`; the accessors below centralize the
 * single cast needed to read them, so call sites stay cast-free.
 */

/** Attached by TabItem's useSortable. */
export interface SortableTabData {
  /** Snapshot of drag-selected tab ids taken when the drag started. */
  selectedItems: number[];
  /** Whether the dragged tab itself is part of the drag selection. */
  isSelected: boolean;
  /** Index of the tab within its window group list. */
  index: number;
}

/** Attached by WindowGroup's useDroppable (drop on the group container itself). */
export interface WindowGroupDropData {
  type: 'window-group';
  windowId: number;
}

/** Reads the sortable payload of a dragged tab. */
export const getSortableTabData = (entry: Active): SortableTabData | undefined =>
  entry.data.current as SortableTabData | undefined;

/** Returns the drop payload when the target is a window group container, undefined otherwise. */
export const getWindowGroupDropData = (entry: Over): WindowGroupDropData | undefined => {
  const data = entry.data.current;
  return data?.type === 'window-group' ? (data as WindowGroupDropData) : undefined;
};
