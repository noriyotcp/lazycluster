import WindowGroup from './WindowGroup';
import type { Tabs } from 'webextension-polyfill';
import { WindowGroupContextProvider } from '../contexts/WindowGroupContext';

interface WindowGroupListProps {
  filteredTabGroups: { windowId: number; tabs: Tabs.Tab[]; windowGroupNumber: number }[];
  activeWindowId: number | null;
  handleCloseTab: (tabId: number) => void;
}

const WindowGroupList = ({ filteredTabGroups, activeWindowId, handleCloseTab }: WindowGroupListProps) => (
  <div className="md:columns-2 mt-4">
    {filteredTabGroups
      .filter(group => group.tabs.length > 0)
      .map(tabGroup => (
        <div key={tabGroup.windowId} className="break-inside-avoid-column">
          <WindowGroupContextProvider key={tabGroup.windowId} value={{ windowGroupNumber: tabGroup.windowGroupNumber }}>
            <WindowGroup
              key={tabGroup.windowId}
              tabGroup={tabGroup}
              activeWindowId={activeWindowId}
              handleCloseTab={handleCloseTab}
              // focusTab={focusTab} // Removed focusTab
            />
          </WindowGroupContextProvider>
        </div>
      ))}
  </div>
);

export default WindowGroupList;
