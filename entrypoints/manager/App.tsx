import { useEffect, useState, useRef, useCallback } from 'react'; // Add useCallback
import { devLog } from '../../src/utils/devLog';
import Header from '../../src/components/Header';
import WindowGroupList from '../../src/components/WindowGroupList';
import type { Tabs } from 'webextension-polyfill';
import { TabFocusProvider } from '../../src/contexts/TabFocusContext';
import { useTabGroupContext } from '../../src/contexts/TabGroupContext';
import { useTabSelectionContext } from '../../src/contexts/TabSelectionContext'; // Import TabSelectionContext
import { useBackgroundConnection } from '../../src/hooks/useBackgroundConnection'; // Import the hook
import './style.css';

// Define a more specific message type based on BaseMessage from the hook
interface BackgroundMessage {
  type: 'UPDATE_TABS' | 'BACKGROUND_INITIALIZED' | 'REQUEST_INITIAL_DATA'; // Known types
  tabs?: chrome.tabs.Tab[]; // Make tabs optional as it's not always present
  payload?: unknown; // Keep payload flexible if needed
}

const Manager = () => {
  const { tabGroups, updateTabGroups } = useTabGroupContext();
  const { clearSelection } = useTabSelectionContext(); // Get clearSelection from context
  const [activeWindowId, setActiveWindowId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchBarRef = useRef<HTMLInputElement>(null);

  // Define the message handler using useCallback to maintain reference stability
  const handleBackgroundMessage = useCallback(
    (message: BackgroundMessage) => {
      devLog(`${new Date()} - Received message from background:`, message); // Log received messages
      if (message.type === 'UPDATE_TABS' && message.tabs) {
        updateTabGroups(message.tabs); // Use the updated tabs
      } else if (message.type === 'BACKGROUND_INITIALIZED') {
        devLog(`${new Date()} - Background script initialized`);
      }
      // No need to handle REQUEST_INITIAL_DATA here, it's sent from client
    },
    [updateTabGroups]
  ); // Dependency array includes updateTabGroups

  // Use the custom hook to manage the connection
  const { sendMessage, isConnected } = useBackgroundConnection<BackgroundMessage>('manager', handleBackgroundMessage);

  // Effect to request initial data once connected
  useEffect(() => {
    if (isConnected) {
      devLog(`${new Date()} - Connection established, requesting initial data...`);
      sendMessage({ type: 'REQUEST_INITIAL_DATA' });
    }
  }, [isConnected, sendMessage]);

  // Effect for getting current window ID and setting up keydown listener
  useEffect(() => {
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

    // Cleanup keydown listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array, runs once on mount

  const handleSearchQueryChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      // Clear selection only if the search query is not empty
      if (query !== '') {
        clearSelection();
      }
    },
    [clearSelection]
  ); // Dependency array includes clearSelection

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
    <TabFocusProvider>
      <Header searchQuery={searchQuery} onSearchQueryChange={handleSearchQueryChange} searchBarRef={searchBarRef} />
      <div className="p-5 pt-0">
        <WindowGroupList filteredTabGroups={filteredTabGroups} activeWindowId={activeWindowId} />
      </div>
    </TabFocusProvider>
  );
};

export default Manager;
