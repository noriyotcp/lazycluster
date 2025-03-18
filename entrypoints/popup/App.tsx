import { useState, useCallback } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';
import './App.css';

const App = () => {
  const [count, setCount] = useState(0);

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
    <>
      <div>
        <a href="https://wxt.dev" target="_blank" rel="noreferrer">
          <img src={wxtLogo} className="logo" alt="WXT logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>WXT + React</h1>
      <div className="card">
        <button onClick={openWindowManager}>Window Manager</button>
        <button onClick={() => setCount(count => count + 1)}>count is {count}</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the WXT and React logos to learn more</p>
    </>
  );
};

export default App;
