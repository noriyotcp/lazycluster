import { useEffect, useState, useRef } from 'react';
import Header from '../../src/components/Header';
import WindowGroupList from '../../src/components/WindowGroupList';
import type { Tabs } from 'webextension-polyfill';
import { TabFocusProvider } from '../../src/contexts/TabFocusContext';
import { useTabGroupContext } from '../../src/contexts/TabGroupContext';
import { ToastProvider } from '../../src/components/ToastProvider'; // Add this import
import './style.css';

type Message = { type: string; tabs: Tabs.Tab[]; tabId?: number };

const Manager = () => {
  const { tabGroups, updateTabGroups } = useTabGroupContext();
  const [activeWindowId, setActiveWindowId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchBarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const connection = chrome.runtime.connect({ name: 'manager' });

    const handleMessage = (message: Message) => {
      if (message.type === 'UPDATE_TABS') {
        updateTabGroups(message.tabs as chrome.tabs.Tab[]); // Type casting
      } else if (message.type === 'BACKGROUND_INITIALIZED') {
        console.log('Background script initialized');
      }
    };

    connection.onMessage.addListener(handleMessage);

    connection.postMessage({ type: 'REQUEST_INITIAL_DATA' });

    chrome.windows.getCurrent().then(window => {
      if (window.id !== undefined) {
        setActiveWindowId(window.id);
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/') {
        // Focus on the search bar if it's not already focused.
        if (document.activeElement?.id !== 'search-bar') {
          searchBarRef.current?.focus();
          event.preventDefault(); // Prevent the default '/' input - Why: To prevent the '/' from being entered into the search bar.
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      connection.onMessage.removeListener(handleMessage);
      connection.disconnect();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [updateTabGroups]);

  const filteredTabGroups = tabGroups
    .map((group, index) => ({ ...group, windowGroupNumber: index }))
    .map(group => ({
      ...group,
      tabs: group.tabs.filter(tab =>
        ['title', 'url'].some(target => {
          const value = (tab as Tabs.Tab)[target as keyof Tabs.Tab];
          return typeof value === 'string' && value.toLowerCase().includes(searchQuery.toLowerCase());
        })
      ) as chrome.tabs.Tab[],
    })) satisfies { windowId: number; tabs: chrome.tabs.Tab[]; windowGroupNumber: number }[]; // Enforce chrome.tabs.Tab[] type.

  return (
    <ToastProvider>
      <TabFocusProvider>
        <Header searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} searchBarRef={searchBarRef} />
        <div className="p-5 pt-0">
          <WindowGroupList filteredTabGroups={filteredTabGroups} activeWindowId={activeWindowId} />
        </div>
      </TabFocusProvider>
    </ToastProvider>
  );
};

export default Manager;
