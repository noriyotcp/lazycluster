import WindowGroup from './WindowGroup';
import { WindowGroupContextProvider } from '../contexts/WindowGroupContext';

interface WindowGroupListProps {
  filteredTabGroups: { windowId: number; tabs: chrome.tabs.Tab[]; windowGroupNumber: number }[];
  activeWindowId: number | null;
  isFiltered?: boolean;
}

const WindowGroupList = ({ filteredTabGroups, activeWindowId, isFiltered = false }: WindowGroupListProps) => (
  <div className="lg:columns-2 mt-4">
    {filteredTabGroups
      .filter(group => group.tabs.length > 0)
      .map(tabGroup => (
        <div key={tabGroup.windowId} className="break-inside-avoid-column">
          <WindowGroupContextProvider key={tabGroup.windowId} value={{ windowGroupNumber: tabGroup.windowGroupNumber }}>
            <WindowGroup key={tabGroup.windowId} tabGroup={tabGroup} activeWindowId={activeWindowId} isFiltered={isFiltered} />
          </WindowGroupContextProvider>
        </div>
      ))}
  </div>
);

export default WindowGroupList;
