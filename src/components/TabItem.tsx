import React from 'react';
import type { Tabs } from 'webextension-polyfill';

interface TabItemProps {
  tab: Tabs.Tab;
  handleCloseTab: (tabId: number) => void;
}

const TabItem = ({ tab, handleCloseTab }: TabItemProps) => {
  return (
    <li className="p-2.5 border-b border-gray-200 flex justify-between items-center">
      <span>{tab.title}</span>
      <button className="btn btn-error btn-xs" onClick={() => handleCloseTab(tab.id!)}>
        Close
      </button>
    </li>
  );
};

export default TabItem;
