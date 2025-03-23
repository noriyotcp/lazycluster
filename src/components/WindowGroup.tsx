import { useState, useCallback } from 'react';
import WindowHeader from './WindowHeader';
import TabList from './TabList';
import type { Tabs } from 'webextension-polyfill';
import WindowActions from './WindowActions';

interface WindowGroupProps {
  tabGroup: {
    windowId: number;
    tabs: Tabs.Tab[];
  };
  activeWindowId: number | null;
  handleCloseTab: (tabId: number) => void;
  focusTab: (tabId: number, windowId: number) => void;
}

const WindowGroup = ({ tabGroup, activeWindowId, handleCloseTab, focusTab }: WindowGroupProps) => {
  const [isCheckedAllTabs, setIsCheckedAllTabs] = useState(false);

  const handleCheckAllTabsChange = useCallback((checked: boolean) => {
    setIsCheckedAllTabs(checked);
  }, []);

  return (
    <div className="collapse collapse-arrow bg-base-100 border-base-300 border rounded-none mb-4">
      <input id={`window-group-collapse-${tabGroup.windowId}`} type="checkbox" defaultChecked={true} />
      <div className="collapse-title font-semibold">
        <WindowHeader windowId={tabGroup.windowId} activeWindowId={activeWindowId} />
      </div>
      <div className="collapse-content">
        <WindowActions windowId={tabGroup.windowId} isCheckedAllTabs={isCheckedAllTabs} />
        <TabList
          tabs={tabGroup.tabs}
          handleCloseTab={handleCloseTab}
          focusTab={focusTab}
          onCheckAllTabsChange={handleCheckAllTabsChange}
        />
      </div>
    </div>
  );
};

export default WindowGroup;
