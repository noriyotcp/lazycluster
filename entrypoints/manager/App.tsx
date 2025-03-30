import { useEffect, useState } from 'react';
import Header from '../../src/components/Header';
import WindowGroupList from '../../src/components/WindowGroupList';
import type { Tabs } from 'webextension-polyfill';
import { TabFocusProvider } from '../../src/contexts/TabFocusContext';
import { useTabGroupContext } from '../../src/contexts/TabGroupContext';
import './style.css';

type Message = { type: string; tabs: Tabs.Tab[]; tabId?: number };

const Manager = () => {
  const { tabGroups, updateTabGroups } = useTabGroupContext();
  const [activeWindowId, setActiveWindowId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // Connect to background script
    const connection = chrome.runtime.connect({ name: 'manager' });

    const handleMessage = (message: Message) => {
      if (message.type === 'UPDATE_TABS') {
        updateTabGroups(message.tabs as chrome.tabs.Tab[]); // Type casting
      } else if (message.type === 'BACKGROUND_INITIALIZED') {
        console.log('Background script initialized');
      }
    };

    connection.onMessage.addListener(handleMessage);

    // Request initial data
    connection.postMessage({ type: 'REQUEST_INITIAL_DATA' });

    // Get active window id
    chrome.windows.getCurrent().then(window => {
      if (window.id !== undefined) {
        setActiveWindowId(window.id);
      }
    });

    return () => {
      connection.onMessage.removeListener(handleMessage);
      connection.disconnect();
    };
  }, [updateTabGroups]);

  // filteredTabGroups is derived from Context's tabGroups, ensuring chrome.tabs.Tab type
  const filteredTabGroups = tabGroups
    .map((group, index) => ({ ...group, windowGroupNumber: index }))
    .map(group => ({
      ...group,
      tabs: group.tabs.filter(tab => tab.title?.toLowerCase().includes(searchQuery.toLowerCase())) as chrome.tabs.Tab[],
    })) satisfies { windowId: number; tabs: chrome.tabs.Tab[]; windowGroupNumber: number }[]; // Enforce chrome.tabs.Tab[] type

  return (
    <TabFocusProvider>
      <Header searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
      <div className="p-5 pt-0">
        <WindowGroupList filteredTabGroups={filteredTabGroups} activeWindowId={activeWindowId} />
      </div>
    </TabFocusProvider>
  );
};

export default Manager;
