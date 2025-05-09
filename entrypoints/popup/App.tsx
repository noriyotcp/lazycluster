import { useCallback } from 'react';
import './style.css';

const App = () => {
  const focusExistingTabInCurrentWindow = async (managerUrl: string, currentWindowId: number) => {
    const tabsInCurrentWindow = await chrome.tabs.query({ url: managerUrl, windowId: currentWindowId });
    if (tabsInCurrentWindow.length > 0) {
      await chrome.tabs.update(tabsInCurrentWindow[0].id!, { active: true });
      return true;
    }
    return false;
  };

  const removeTabsInOtherWindows = async (managerUrl: string, currentWindowId: number) => {
    const allTabs = await chrome.tabs.query({ url: managerUrl });
    const tabsInOtherWindows = allTabs.filter(tab => tab.windowId !== currentWindowId);
    if (tabsInOtherWindows.length > 0) {
      await Promise.all(tabsInOtherWindows.map(tab => chrome.tabs.remove(tab.id!)));
      return true;
    }
    return false;
  };

  const createNewManagerTab = async (managerUrl: string) => {
    await chrome.tabs.create({ url: managerUrl, pinned: true });
  };

  const openWindowManager = useCallback(async () => {
    const managerUrl = chrome.runtime.getURL('/manager.html');
    const currentWindow = await chrome.windows.getCurrent();
    const currentWindowId = currentWindow.id!;

    if (await focusExistingTabInCurrentWindow(managerUrl, currentWindowId)) {
      return;
    }

    await removeTabsInOtherWindows(managerUrl, currentWindowId);
    await createNewManagerTab(managerUrl);
  }, []);

  return (
    // Apply styles to center content and set min height/width, mimicking original body styles
    <div className="flex items-center justify-center min-h-screen min-w-[320px]">
      {/* Apply max-width, auto margin, padding, and text alignment, mimicking original #root styles */}
      <div className="max-w-screen-xl mx-auto p-8 text-center">
        {/* Apply heading styles */}
        <h1 className="text-5xl leading-tight">lazycluster</h1>
        {/* Apply card styles with padding */}
        <div className="card p-8">
          {/* Apply button styles */}
          <button className="btn btn-neutral" onClick={openWindowManager}>
            Window Manager
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
