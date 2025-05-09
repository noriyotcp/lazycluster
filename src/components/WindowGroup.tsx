import WindowHeader from './WindowHeader';
import TabList from './TabList';
import WindowActions from './WindowActions';

interface WindowGroupProps {
  tabGroup: {
    windowId: number;
    tabs: chrome.tabs.Tab[];
  };
  activeWindowId: number | null;
}
const WindowGroup = ({ tabGroup, activeWindowId }: WindowGroupProps) => {
  return (
    <div className="collapse collapse-arrow bg-base-100 border-base-300 border rounded-none mb-4">
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
