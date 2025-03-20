import React, { useEffect, useState, useCallback } from 'react';
import { Tab } from '@/src/@types/types';
import Header from '../../src/components/Header';
import './style.css';

type Message = { type: string; tabs: Tab[]; tabId?: number };

interface TabGroup {
  windowId: number;
  tabs: Tab[];
}

const Manager = () => {
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const handleThemeToggle = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    // Connect to background script
    const connection = chrome.runtime.connect({ name: 'manager' });

    const handleMessage = (message: Message) => {
      if (message.type === 'UPDATE_TABS') {
        const groupedTabs = groupTabsByWindow(message.tabs);
        // Get active window ID within the message handling
        chrome.windows.getCurrent().then(window => {
          if (window.id !== undefined) {
            const sortedTabGroups = sortTabGroups(groupedTabs, window.id);
            setTabGroups(sortedTabGroups);
          } else {
            setTabGroups(groupedTabs); // If window.id is undefined, set without sorting
          }
        });
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
  }, []);

  const sortTabGroups = (tabGroups: TabGroup[], activeWindowId: number | null): TabGroup[] => {
    if (activeWindowId === null) {
      return tabGroups; // No sorting needed if active window ID is not available
    }

    const activeWindowGroupIndex = tabGroups.findIndex(group => group.windowId === activeWindowId);

    if (activeWindowGroupIndex === -1) {
      return tabGroups; // No sorting needed if the active window group is not found
    }

    const activeWindowGroup = tabGroups.splice(activeWindowGroupIndex, 1)[0]; // Extracts the active window's group
    return [activeWindowGroup, ...tabGroups]; // Insert the active window group at the beginning
  };

  const groupTabsByWindow = (tabs: Tab[]): TabGroup[] => {
    const groups: { [windowId: number]: Tab[] } = {};
    tabs.forEach(tab => {
      if (tab.windowId) {
        if (!groups[tab.windowId]) {
          groups[tab.windowId] = [];
        }
        groups[tab.windowId].push(tab);
      }
    });

    return Object.entries(groups).map(([windowId, tabs]) => ({ windowId: parseInt(windowId), tabs }));
  };

  const closeTab = useCallback((tabId: number) => {
    chrome.tabs.remove(tabId, () => {
      if (chrome.runtime.lastError) {
        console.error('タブの削除に失敗しました:', chrome.runtime.lastError);
      } else {
        setTabGroups(prevTabGroups =>
          prevTabGroups.map(group => ({
            ...group,
            tabs: group.tabs.filter(tab => tab.id !== tabId),
          }))
        );
      }
    });
  }, []);

  const handleCloseTab = useCallback(
    (tabId: number) => {
      closeTab(tabId);
    },
    [closeTab]
  );

  const filteredTabGroups = tabGroups.map(group => ({
    ...group,
    tabs: group.tabs.filter(tab => tab.title?.toLowerCase().includes(searchQuery.toLowerCase())),
  }));

  return (
    <div className="p-5">
      <Header
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        theme={theme}
        onThemeToggle={handleThemeToggle}
      />
      {filteredTabGroups.map((group, index) => (
        <div key={group.windowId} className="mb-5">
          <h2>{group.windowId === activeWindowId ? 'Current Window' : `Window ${index + 1}`}</h2>
          <ul className="list-none">
            {group.tabs.map(tab => (
              <li key={tab.id} className="p-2.5 border-b border-gray-200 flex justify-between items-center">
                <span>{tab.title}</span>
                <button
                  className="bg-red-500 text-white py-1 px-2.5 text-sm rounded-md"
                  onClick={() => handleCloseTab(tab.id!)}
                >
                  Close
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Manager;
