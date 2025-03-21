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
  <>
    {filteredTabGroups.map((tabGroup, index) => (
      <WindowGroupContextProvider key={tabGroup.windowId} value={{ windowGroupNumber: index }}>
        <WindowGroup
          key={tabGroup.windowId}
          tabGroup={tabGroup}
          activeWindowId={activeWindowId}
          handleCloseTab={handleCloseTab}
          focusTab={focusTab}
        />
      </WindowGroupContextProvider>
    ))}
  </>
);

export default WindowGroupList;
