import React from 'react';
import WindowGroup from './WindowGroup';
import type { Tabs } from 'webextension-polyfill';

interface WindowGroupListProps {
  filteredTabGroups: { windowId: number; tabs: Tabs.Tab[] }[];
  activeWindowId: number | null;
  handleCloseTab: (tabId: number) => void;
  sequenceNumber?: number;
}

const WindowGroupList = ({ filteredTabGroups, activeWindowId, handleCloseTab }: WindowGroupListProps) => (
  <ul className="window-group-list-container">
    {filteredTabGroups.map((tabGroup, index) => (
      <WindowGroup
        key={tabGroup.windowId}
        tabGroup={tabGroup}
        activeWindowId={activeWindowId}
        handleCloseTab={handleCloseTab}
        sequenceNumber={index}
      />
    ))}
  </ul>
);

export default WindowGroupList;
