import { useRef, memo } from 'react';
import type { KeyboardEvent } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TabItem from './TabItem';
import TabDropIndicator from './TabDropIndicator';

interface TabListProps {
  tabs: chrome.tabs.Tab[];
  isFiltered?: boolean;
}

const TabList = ({ tabs, isFiltered = false }: TabListProps) => {
  const listRef = useRef<HTMLUListElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
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
    <SortableContext items={tabs.map(t => t.id!)} strategy={verticalListSortingStrategy} disabled={isFiltered}>
      <ul ref={listRef} className="list shadow-md" onKeyDown={handleKeyDown}>
        {tabs.map((tab, index) => (
          <div key={tab.id}>
            <TabDropIndicator tabId={tab.id!} position="top" />
            <TabItem tab={tab} isFiltered={isFiltered} index={index} windowId={tab.windowId!} tabs={tabs} />
            <TabDropIndicator tabId={tab.id!} position="bottom" />
          </div>
        ))}
      </ul>
    </SortableContext>
  );
};

// Memoized: TabList props no longer include drag state, so drag-over updates
// bypass this component entirely — only the tiny TabDropIndicator consumers re-render.
export default memo(TabList);
