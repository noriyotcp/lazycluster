import React from 'react';
import TabItem from './TabItem';
import type { Tabs } from 'webextension-polyfill';

interface TabListProps {
  tabs: Tabs.Tab[];
  handleCloseTab: (tabId: number) => void;
}

const TabList = ({ tabs, handleCloseTab }: TabListProps) => (
  <ul className="list-none">
    {tabs.map(tab => (
      <TabItem key={tab.id} tab={tab} handleCloseTab={handleCloseTab} />
    ))}
  </ul>
);

export default TabList;
