import React from 'react';
import WindowHeader from './WindowHeader';
import TabList from './TabList';
import type { Tabs } from 'webextension-polyfill';

interface WindowGroupProps {
  tabGroup: {
    windowId: number;
    tabs: Tabs.Tab[];
  };
  activeWindowId: number | null;
  handleCloseTab: (tabId: number) => void;
  sequenceNumber: number;
}

const WindowGroup = ({ tabGroup, activeWindowId, handleCloseTab, sequenceNumber }: WindowGroupProps) => (
  <div className={`window-group-container ${tabGroup.windowId === activeWindowId ? 'active-window' : ''}`}>
    <WindowHeader windowId={tabGroup.windowId} activeWindowId={activeWindowId} sequenceNumber={sequenceNumber} />
    <TabList tabs={tabGroup.tabs} handleCloseTab={handleCloseTab} />
  </div>
);

export default WindowGroup;
