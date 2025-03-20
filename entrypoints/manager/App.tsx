import React, { useEffect, useState, useCallback } from 'react';
import Header from '../../src/components/Header';
import WindowGroupList from '../../src/components/WindowGroupList';
import type { Tabs } from 'webextension-polyfill';
import './style.css';

type Message = { type: string; tabs: Tabs.Tab[]; tabId?: number };

interface TabGroup {
  windowId: number;
  tabs: Tabs.Tab[];
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

  const groupTabsByWindow = (tabs: Tabs.Tab[]): TabGroup[] => {
    const groups: { [windowId: number]: Tabs.Tab[] } = {};
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
      <WindowGroupList
        filteredTabGroups={filteredTabGroups}
        activeWindowId={activeWindowId}
        handleCloseTab={handleCloseTab}
      />
    </div>
  );
};

export default Manager;
