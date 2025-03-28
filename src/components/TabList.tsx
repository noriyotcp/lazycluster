import React, { useEffect, useRef } from 'react';
import TabItem from './TabItem';
import type { Tabs } from 'webextension-polyfill';
import { useTabSelectionContext } from '../../src/contexts/TabSelectionContext';

interface TabListProps {
  tabs: Tabs.Tab[];
  handleCloseTab: (tabId: number) => void;
  onAnyTabCheckChange: (checked: boolean) => void;
}

const TabList = ({ tabs, handleCloseTab, onAnyTabCheckChange }: TabListProps) => {
  const { selectedTabIds } = useTabSelectionContext();

  const isAnyTabChecked = tabs.some(tab => selectedTabIds.includes(tab.id!));

  useEffect(() => {
    onAnyTabCheckChange(isAnyTabChecked);
  }, [isAnyTabChecked, onAnyTabCheckChange]);

  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const listElement = listRef.current;

    if (listElement) {
      let lastKeyTime = 0;
      let lastKey = '';

      const handleKeyDown = (event: KeyboardEvent) => {
        const activeElement = document.activeElement;
        if (!activeElement || !listElement.contains(activeElement)) {
          return;
        }

        const tabItems = Array.from(listElement.querySelectorAll('li[tabindex="0"]')) as HTMLElement[];
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
          case 'g': {
            const now = Date.now();
            if (lastKey === 'g' && now - lastKeyTime < 500) {
              nextIndex = 0;
            } else if (event.shiftKey) {
              nextIndex = tabItems.length - 1;
            }
            lastKey = 'g';
            lastKeyTime = now;
            break;
          }
          case 'G':
            nextIndex = tabItems.length - 1;
            break;
        }

        if (nextIndex !== -1) {
          event.preventDefault();
          (tabItems[nextIndex] as HTMLElement).focus();
        }
      };

      listElement.addEventListener('keydown', handleKeyDown);

      return () => {
        listElement.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [tabs]);

  return (
    <ul ref={listRef} className="list shadow-md">
      {tabs.map(tab => (
        <TabItem key={tab.id} tab={tab} handleCloseTab={handleCloseTab} />
      ))}
    </ul>
  );
};

export default TabList;
