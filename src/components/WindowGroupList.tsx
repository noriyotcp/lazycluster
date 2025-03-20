import React from 'react';
import WindowGroup from './WindowGroup';

interface WindowGroupListProps {
  filteredTabGroups: { windowId: number; tabs: chrome.tabs.Tab[] }[];
  activeWindowId: number | null;
}

const WindowGroupList = ({ filteredTabGroups, activeWindowId }: WindowGroupListProps) => (
  <ul className="window-group-list-container">
    {filteredTabGroups.map(tabGroup => (
      <WindowGroup key={tabGroup.windowId} tabGroup={tabGroup} activeWindowId={activeWindowId} />
    ))}
  </ul>
);

export default WindowGroupList;
