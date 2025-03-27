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

  return (
    <ul ref={listRef} className="list shadow-md">
      {tabs.map(tab => (
        <TabItem key={tab.id} tab={tab} handleCloseTab={handleCloseTab} />
      ))}
    </ul>
  );
};

export default TabList;
