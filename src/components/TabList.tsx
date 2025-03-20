import React from 'react';
import TabItem from './TabItem';

interface TabListProps {
  tabs: chrome.tabs.Tab[];
}

const TabList: React.FC<TabListProps> = ({ tabs }) => {
  return (
    <ul id="tabList">
      {tabs.map(tab => (
        <TabItem key={tab.id} tab={tab} />
      ))}
    </ul>
  );
};

export default TabList;
