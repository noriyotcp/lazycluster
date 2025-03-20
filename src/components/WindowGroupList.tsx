import React from 'react';
import WindowGroup from './WindowGroup';
import { Tab } from '@/src/@types/types';

interface WindowGroupListProps {
  filteredTabGroups: { windowId: number; tabs: Tab[] }[];
  activeWindowId: number | null;
  handleCloseTab: (tabId: number) => void;
}

const WindowGroupList = ({ filteredTabGroups, activeWindowId, handleCloseTab }: WindowGroupListProps) => (
  <ul className="window-group-list-container">
    {filteredTabGroups.map(tabGroup => (
      <WindowGroup
        key={tabGroup.windowId}
        tabGroup={tabGroup}
        activeWindowId={activeWindowId}
        handleCloseTab={handleCloseTab}
      />
    ))}
  </ul>
);

export default WindowGroupList;
