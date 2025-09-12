import WindowHeader from './WindowHeader';
import TabList from './TabList';
import WindowActions from './WindowActions';
import { useWindowGroupContext } from '../contexts/WindowGroupContext';
import { useDeletionContext } from '../contexts/DeletionContext';

interface WindowGroupProps {
  tabGroup: {
    windowId: number;
    tabs: chrome.tabs.Tab[];
  };
  activeWindowId: number | null;
}
const WindowGroup = ({ tabGroup, activeWindowId }: WindowGroupProps) => {
  const { windowGroupNumber } = useWindowGroupContext();
  const { removingWindowIds } = useDeletionContext();
  const isWindowRemoving = removingWindowIds.has(tabGroup.windowId);

  return (
    <div
      // duration-150 must match ANIMATION_DURATIONS.REMOVAL_MS (150ms)
      className={`collapse collapse-arrow bg-base-100 border-base-300 rounded-none transition-all duration-150 ease-out overflow-hidden ${
        isWindowRemoving ? 'opacity-0 max-h-0 scale-y-0 mb-0 border-0' : 'opacity-100 max-h-fit scale-y-100 mb-4 border'
      }`}
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
