import WindowGroup from './WindowGroup';
import type { Tabs } from 'webextension-polyfill';
import { WindowGroupContextProvider } from '../contexts/WindowGroupContext';

interface WindowGroupListProps {
  filteredTabGroups: { windowId: number; tabs: Tabs.Tab[] }[];
  activeWindowId: number | null;
  handleCloseTab: (tabId: number) => void;
  focusTab: (tabId: number, windowId: number) => void;
}

const WindowGroupList = ({ filteredTabGroups, activeWindowId, handleCloseTab, focusTab }: WindowGroupListProps) => (
  <div className="columns-2 mt-4">
    {filteredTabGroups.map((tabGroup, index) => (
      <div key={tabGroup.windowId} className="break-inside-avoid-column">
        <WindowGroupContextProvider key={tabGroup.windowId} value={{ windowGroupNumber: index }}>
          <WindowGroup
            key={tabGroup.windowId}
            tabGroup={tabGroup}
            activeWindowId={activeWindowId}
            handleCloseTab={handleCloseTab}
            focusTab={focusTab}
          />
        </WindowGroupContextProvider>
      </div>
    ))}
  </div>
);

export default WindowGroupList;
