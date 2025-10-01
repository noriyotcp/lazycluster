import React, { useRef } from 'react';
import TabItem from './TabItem';

interface TabListProps {
  tabs: chrome.tabs.Tab[];
}

const TabList = ({ tabs }: TabListProps) => {
  const listRef = useRef<HTMLUListElement>(null);

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
    <ul ref={listRef} className="list shadow-md" onKeyDown={handleKeyDown}>
      {tabs.map(tab => (
        <TabItem key={tab.id} tab={tab} />
      ))}
    </ul>
  );
};

export default TabList;
