import { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTabSelectionContext } from '../../src/contexts/TabSelectionContext';
import { useTabFocusContext } from '../../src/contexts/TabFocusContext';
import { useDeletionState } from '../contexts/DeletionStateContext';
import { useTabGroupColor } from '../contexts/TabGroupColorContext';
import { useToast } from './ToastProvider';
import Alert from './Alert';
import { getTabGroupBorderColorClass } from '../utils/tabGroupColors';

const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

interface TabItemProps {
  tab: chrome.tabs.Tab;
  isFiltered?: boolean;
}

const globeIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
      <path
        fillRule="evenodd"
        d="M3.757 4.5c.18.217.376.42.586.608.153-.61.354-1.175.596-1.678A5.53 5.53 0 0 0 3.757 4.5ZM8 1a6.994 6.994 0 0 0-7 7 7 7 0 1 0 7-7Zm0 1.5c-.476 0-1.091.386-1.633 1.427-.293.564-.531 1.267-.683 2.063A5.48 5.48 0 0 0 8 6.5a5.48 5.48 0 0 0 2.316-.51c-.152-.796-.39-1.499-.683-2.063C9.09 2.886 8.476 2.5 8 2.5Zm3.657 2.608a8.823 8.823 0 0 0-.596-1.678c.444.298.842.659 1.182 1.07-.18.217-.376.42-.586.608Zm-1.166 2.436A6.983 6.983 0 0 1 8 8a6.983 6.983 0 0 1-2.49-.456 10.703 10.703 0 0 0 .202 2.6c.72.231 1.49.356 2.288.356.798 0 1.568-.125 2.29-.356a10.705 10.705 0 0 0 .2-2.6Zm1.433 1.85a12.652 12.652 0 0 0 .018-2.609c.405-.276.78-.594 1.117-.947a5.48 5.48 0 0 1 .44 2.262 7.536 7.536 0 0 1-1.575 1.293Zm-2.172 2.435a9.046 9.046 0 0 1-3.504 0c.039.084.078.166.12.244C6.907 13.114 7.523 13.5 8 13.5s1.091-.386 1.633-1.427c.04-.078.08-.16.12-.244Zm1.31.74a8.5 8.5 0 0 0 .492-1.298c.457-.197.893-.43 1.307-.696a5.526 5.526 0 0 1-1.8 1.995Zm-6.123 0a8.507 8.507 0 0 1-.493-1.298 8.985 8.985 0 0 1-1.307-.696 5.526 5.526 0 0 0 1.8 1.995ZM2.5 8.1c.463.5.993.935 1.575 1.293a12.652 12.652 0 0 1-.018-2.608 7.037 7.037 0 0 1-1.117-.947 5.48 5.48 0 0 0-.44 2.262Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

const TabItem = ({ tab, isFiltered = false }: TabItemProps) => {
  const { selectedTabIds, addTabToSelection, removeTabFromSelection } = useTabSelectionContext();
  const [isChecked, setIsChecked] = useState(false);
  const { focusActiveTab } = useTabFocusContext();
  const checkboxRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { isDeleting, setDeletingState } = useDeletionState();
  const isDeletingTab = isDeleting({ type: 'tab', id: tab.id! });
  const { getGroupColor } = useTabGroupColor();
  const groupColor = getGroupColor(tab.groupId ?? chrome.tabGroups.TAB_GROUP_ID_NONE);

  // useSortable hook for drag-and-drop
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isSorting } =
    useSortable({
      id: tab.id!,
      disabled: isFiltered,
      // Disable layout animation during sorting to prevent items from moving immediately
      animateLayoutChanges: ({ isSorting }) => !isSorting,
    });

  const style = {
    // Disable transform during sorting to prevent other items from moving
    transform: isSorting ? undefined : CSS.Transform.toString(transform),
    transition,
    // Show original item with reduced opacity during drag (DragOverlay will show the clone)
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    setIsChecked(selectedTabIds.has(tab.id!));
  }, [selectedTabIds, tab.id]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (tab.id && tab.windowId) {
      focusActiveTab(tab.id, tab.windowId);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      addTabToSelection(tab.id!);
    } else {
      removeTabFromSelection(tab.id!);
    }
    setIsChecked(e.target.checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
      if (checkboxRef.current) {
        // Simulate a click event on the checkbox
        // This ensures the onChange handler and state updates are triggered correctly
        checkboxRef.current.click();
      }
    }
  };

  const handleCloseButtonClick = async () => {
    setDeletingState({ type: 'tab', id: tab.id!, isDeleting: true });
    try {
      await chrome.tabs.remove(tab.id!);
    } catch (error) {
      setDeletingState({ type: 'tab', id: tab.id!, isDeleting: false });
      showToast(<Alert message="Failed to close tab" />);
      console.error('Failed to close tab:', error);
    }
  };

  // Apply group color if tab belongs to a group, otherwise use transparent border
  const borderColorClass = groupColor ? getTabGroupBorderColorClass(groupColor) : 'border-l-transparent';

  return (
    <div inert={isDeletingTab || undefined} className="inert:opacity-50">
      <li
        ref={setNodeRef}
        style={style}
        className={`list-row p-2 items-center rounded-none even:bg-base-200 focus:outline-1 focus:[outline-style:auto] group/tabitem border-l-[3px] ${borderColorClass}`}
        onKeyDown={handleKeyDown}
        {...attributes}
        tabIndex={0}
      >
        {/* Drag handle */}
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          disabled={isFiltered}
          className={
            isFiltered
              ? 'text-gray-400 opacity-40 cursor-not-allowed px-1'
              : 'text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing px-1'
          }
          aria-label="Drag to reorder"
        >
          ⋮⋮
        </button>
        <input
          id={`tab-${tab.id}`}
          type="checkbox"
          className="checkbox checkbox-xs"
          checked={isChecked}
          onChange={handleCheckboxChange}
          ref={checkboxRef}
        />
        <div>
          {tab.favIconUrl ? (
            <img
              className="size-4"
              src={tab.favIconUrl ?? ''}
              alt={tab.title ?? ''}
              onError={e => ((e.target as HTMLImageElement).src = '')}
            />
          ) : (
            globeIcon()
          )}
        </div>
        <a
          className="list-col-grow cursor-pointer focus:outline-1 truncate hover:underline"
          href={tab.url}
          onClick={handleClick}
        >
          {tab.title}
        </a>
        <a className="hidden group-hover/tabitem:inline text-gray-500 underline" href={tab.url} onClick={handleClick}>
          {extractDomain(tab.url || '')}
        </a>
        <button className="btn btn-outline btn-error btn-xs" onClick={handleCloseButtonClick}>
          Close
        </button>
      </li>
    </div>
  );
};

export default TabItem;
