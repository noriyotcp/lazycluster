import React from 'react';
import WindowHeader from './WindowHeader';
import TabList from './TabList';

interface WindowGroupProps {
  tabGroup: {
    windowId: number;
    tabs: chrome.tabs.Tab[];
  };
  activeWindowId: number | null;
}

const WindowGroup: React.FC<WindowGroupProps> = ({ tabGroup, activeWindowId }) => {
  return (
    <div className={`window-group-container ${tabGroup.windowId === activeWindowId ? 'active-window' : ''}`}>
      <WindowHeader windowId={tabGroup.windowId} activeWindowId={activeWindowId} />
      <TabList tabs={tabGroup.tabs} />
    </div>
  );
};

export default WindowGroup;
