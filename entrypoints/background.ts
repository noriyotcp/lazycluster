import { devLog } from '../src/utils/devLog';
import {
  MANAGER_PORT_NAME,
  type BackgroundToManagerMessage,
  type ManagerToBackgroundMessage,
} from '../src/types/messages';

export default defineBackground(() => {
  devLog('Hello background!', { id: chrome.runtime.id });

  let port: chrome.runtime.Port | null = null;

  // Debounce timer for coalescing rapid tab events into a single update
  let updateTimer: ReturnType<typeof setTimeout> | null = null;
  const DEBOUNCE_MS = 50;

  const debouncedUpdateTabs = () => {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
      updateTimer = null;
      if (port) {
        updateTabs(port);
      }
    }, DEBOUNCE_MS);
  };

  // Function to get tabs with windowId
  const getTabs = async (): Promise<chrome.tabs.Tab[]> => {
    try {
      const windows = await chrome.windows.getAll({ populate: true });
      return windows.reduce<chrome.tabs.Tab[]>((acc, win) => {
        if (win.tabs) {
          acc.push(...(win.tabs as chrome.tabs.Tab[]));
        }
        return acc;
      }, []);
    } catch (error) {
      console.error('Failed to get tabs:', error);
      return [];
    }
  };

  const updateTabs = async (port: chrome.runtime.Port) => {
    try {
      const tabs = await getTabs();
      port.postMessage({ type: 'UPDATE_TABS', tabs } satisfies BackgroundToManagerMessage);
    } catch (error) {
      console.error('Failed to update tabs:', error);
    }
  };

  // Listen for tab creation
  chrome.tabs.onCreated.addListener(() => {
    devLog(`${new Date()} - onCreated:`, port);
    debouncedUpdateTabs();
  });

  // Listen for tab updates
  chrome.tabs.onUpdated.addListener(
    (tabId: number, changeInfo: { status?: string; groupId?: number }, _tab: chrome.tabs.Tab) => {
      // Process when the tab status is 'complete' or groupId changes
      if (changeInfo.status === 'complete' || changeInfo.groupId !== undefined) {
        devLog(`${new Date()} - onUpdated for tab ${tabId}`, changeInfo);
        debouncedUpdateTabs();
      }
    }
  );

  // Listen for tab removal
  chrome.tabs.onRemoved.addListener(() => {
    devLog(`${new Date()} - onRemoved:`, port);
    debouncedUpdateTabs();
  });

  // Listen for tab movement within a window
  chrome.tabs.onMoved.addListener(() => {
    devLog(`${new Date()} - onMoved:`, port);
    debouncedUpdateTabs();
  });

  // Listen for tab attachment (moved into a window)
  chrome.tabs.onAttached.addListener(() => {
    devLog(`${new Date()} - onAttached:`, port);
    debouncedUpdateTabs();
  });

  // Listen for tab detachment (moved out of a window)
  chrome.tabs.onDetached.addListener(() => {
    devLog(`${new Date()} - onDetached:`, port);
    debouncedUpdateTabs();
  });

  // Listen for tab group creation
  chrome.tabGroups.onCreated.addListener(() => {
    devLog(`${new Date()} - tabGroups.onCreated:`, port);
    debouncedUpdateTabs();
  });

  // Listen for tab group updates (color change, title change, etc.)
  chrome.tabGroups.onUpdated.addListener(() => {
    devLog(`${new Date()} - tabGroups.onUpdated:`, port);
    debouncedUpdateTabs();
  });

  // Listen for tab group removal
  chrome.tabGroups.onRemoved.addListener(() => {
    devLog(`${new Date()} - tabGroups.onRemoved:`, port);
    debouncedUpdateTabs();
  });

  const connect = (p: chrome.runtime.Port) => {
    devLog(`${new Date()} - onConnect`);
    if (import.meta.env.MODE === 'development') {
      console.dir(p);
    }
    if (p.name === MANAGER_PORT_NAME) {
      port = p;
      port.onDisconnect.addListener(() => {
        devLog(`${new Date()} - onDisconnect`);
        if (import.meta.env.MODE === 'development') {
          console.dir(port);
        }
        port = null;
      });

      port.onMessage.addListener(async (message: ManagerToBackgroundMessage) => {
        if (message.type === 'REQUEST_INITIAL_DATA') {
          try {
            const tabs = await getTabs();
            if (port) {
              port.postMessage({ type: 'UPDATE_TABS', tabs } satisfies BackgroundToManagerMessage);
              port.postMessage({ type: 'BACKGROUND_INITIALIZED' } satisfies BackgroundToManagerMessage);
            }
          } catch (error) {
            console.error('Failed to send initial data:', error);
          }
        }
      });
    }
  };

  chrome.runtime.onConnect.addListener(connect);
});
