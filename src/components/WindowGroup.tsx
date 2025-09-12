import WindowHeader from './WindowHeader';
import TabList from './TabList';
import WindowActions from './WindowActions';
import { useWindowGroupContext } from '../contexts/WindowGroupContext';

interface WindowGroupProps {
  tabGroup: {
    windowId: number;
    tabs: chrome.tabs.Tab[];
  };
  activeWindowId: number | null;
}
const WindowGroup = ({ tabGroup, activeWindowId }: WindowGroupProps) => {
  const { windowGroupNumber } = useWindowGroupContext();
  
  return (
    <div 
      className="collapse collapse-arrow bg-base-100 border-base-300 border rounded-none mb-4"
      data-window-group-number={windowGroupNumber}
      data-window-id={tabGroup.windowId}
    >
      <input id={`window-group-collapse-${tabGroup.windowId}`} type="checkbox" defaultChecked={true} />
      <div className="collapse-title font-semibold">
        <WindowHeader windowId={tabGroup.windowId} activeWindowId={activeWindowId} />
      </div>
      <div className="collapse-content">
        <WindowActions windowId={tabGroup.windowId} visibleTabs={tabGroup.tabs} />
        <TabList tabs={tabGroup.tabs} />
      </div>
    </div>
  );
};

export default WindowGroup;
