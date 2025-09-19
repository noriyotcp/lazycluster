import { devLog } from '../src/utils/devLog';

export default defineBackground(() => {
  devLog('Hello background!', { id: chrome.runtime.id });

  let port: chrome.runtime.Port | null = null;

  // Function to get tabs with windowId
  const getTabs = async (): Promise<chrome.tabs.Tab[]> => {
    const windows = await chrome.windows.getAll({ populate: true });
    const tabs: chrome.tabs.Tab[] = windows.reduce<chrome.tabs.Tab[]>((acc, win) => {
      if (win.tabs) {
        acc.push(...(win.tabs as chrome.tabs.Tab[]));
      }
      return acc;
    }, []);
    return tabs;
  };

  const updateTabs = async (port: chrome.runtime.Port) => {
    const tabs = await getTabs();
    port.postMessage({ type: 'UPDATE_TABS', tabs });
  };

  // Listen for tab creation
  chrome.tabs.onCreated.addListener(async () => {
    devLog(`${new Date()} - onCreated:`, port);
    if (port) {
      updateTabs(port);
    }
  });

  // Listen for tab updates
  chrome.tabs.onUpdated.addListener(async (tabId: number, changeInfo: { status?: string }, _tab: chrome.tabs.Tab) => {
    // Only process when the tab status is 'complete' to avoid multiple updates during loading
    if (changeInfo.status === 'complete') {
      devLog(`${new Date()} - onUpdated (complete) for tab ${tabId}`);
      if (port) {
        updateTabs(port);
      }
    }
  });

  // Listen for tab removal
  chrome.tabs.onRemoved.addListener(async () => {
    devLog(`${new Date()} - onRemoved:`, port);
    if (port) {
      updateTabs(port);
    }
  });

  // Listen for tab movement within a window
  chrome.tabs.onMoved.addListener(async () => {
    devLog(`${new Date()} - onMoved:`, port);
    if (port) {
      updateTabs(port);
    }
  });

  // Listen for tab attachment (moved into a window)
  chrome.tabs.onAttached.addListener(async () => {
    devLog(`${new Date()} - onAttached:`, port);
    if (port) {
      updateTabs(port);
    }
  });

  // Listen for tab detachment (moved out of a window)
  chrome.tabs.onDetached.addListener(async () => {
    devLog(`${new Date()} - onDetached:`, port);
    if (port) {
      updateTabs(port);
    }
  });

  const connect = (p: chrome.runtime.Port) => {
    devLog(`${new Date()} - onConnect`);
    if (import.meta.env.MODE === 'development') {
      console.dir(p);
    }
    if (p.name === 'manager') {
      port = p as chrome.runtime.Port;
      port.onDisconnect.addListener(() => {
        devLog(`${new Date()} - onDisconnect`);
        if (import.meta.env.MODE === 'development') {
          console.dir(port);
        }
        port = null;
      });

      port.onMessage.addListener(async message => {
        if (message.type === 'REQUEST_INITIAL_DATA') {
          const tabs = await getTabs();
          if (port) {
            // Add this check
            port.postMessage({ type: 'UPDATE_TABS', tabs });
            port.postMessage({ type: 'BACKGROUND_INITIALIZED' });
          }
        }
      });
    }
  };

  chrome.runtime.onConnect.addListener(connect);

  chrome.runtime.onMessage.addListener((request: { action?: string; tabId?: number }) => {
    if (request.action === 'closeTab' && request.tabId) {
      chrome.tabs.remove(request.tabId);
    }
  });
});
