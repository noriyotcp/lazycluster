import type { Tabs } from 'webextension-polyfill';

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  let port: chrome.runtime.Port | null = null;

  // Function to get tabs with windowId
  const getTabs = async (): Promise<Tabs.Tab[]> => {
    const windows = await browser.windows.getAll({ populate: true });
    const tabs: Tabs.Tab[] = windows.reduce<Tabs.Tab[]>((acc, win) => {
      if (win.tabs) {
        acc.push(...(win.tabs as Tabs.Tab[]));
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
  browser.tabs.onCreated.addListener(async () => {
    if (port) {
      updateTabs(port);
    }
  });

  // Listen for tab updates
  browser.tabs.onUpdated.addListener(async () => {
    if (port) {
      updateTabs(port);
    }
  });

  // Listen for tab removal
  browser.tabs.onRemoved.addListener(async () => {
    if (port) {
      updateTabs(port);
    }
  });

  browser.runtime.onConnect.addListener(p => {
    if (p.name === 'manager') {
      port = p as chrome.runtime.Port;
      port.onDisconnect.addListener(() => {
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
  });

  browser.runtime.onMessage.addListener(request => {
    if (request.action === 'closeTab' && request.tabId) {
      chrome.tabs.remove(request.tabId);
    }
  });
});
