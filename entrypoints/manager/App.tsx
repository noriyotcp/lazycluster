import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { devLog } from '../../src/utils/devLog';
import Header from '../../src/components/Header';
import WindowGroupList from '../../src/components/WindowGroupList';
import type { Tabs } from 'webextension-polyfill';
import { TabFocusProvider } from '../../src/contexts/TabFocusContext';
import { useTabGroupContext } from '../../src/contexts/TabGroupContext';
import { useTabSelectionContext } from '../../src/contexts/TabSelectionContext'; // Import TabSelectionContext
import { useBackgroundConnection } from '../../src/hooks/useBackgroundConnection'; // Import the hook
import './style.css';

// Constants for keyboard navigation
const WINDOW_GROUP_SEQUENCE_TIMEOUT_MS = 3000; // Time to wait for second key in w+number sequence

// Define a more specific message type based on BaseMessage from the hook
interface BackgroundMessage {
  type: 'UPDATE_TABS' | 'BACKGROUND_INITIALIZED' | 'REQUEST_INITIAL_DATA'; // Known types
  tabs?: chrome.tabs.Tab[]; // Make tabs optional as it's not always present
  payload?: unknown; // Keep payload flexible if needed
}

const Manager = () => {
  const { tabGroups, updateTabGroups } = useTabGroupContext();
  const { clearSelection, syncWithExistingTabs } = useTabSelectionContext();
  const [activeWindowId, setActiveWindowId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sequenceActive, setSequenceActive] = useState<boolean>(false);
  const searchBarRef = useRef<HTMLInputElement>(null);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sequenceActiveRef = useRef<boolean>(false); // Ref to access latest sequenceActive value in event handlers to avoid stale closure issues

  // Define the message handler using useCallback to maintain reference stability
  const handleBackgroundMessage = useCallback(
    (message: BackgroundMessage) => {
      devLog(`${new Date()} - Received message from background:`, message); // Log received messages
      if (message.type === 'UPDATE_TABS' && message.tabs) {
        updateTabGroups(message.tabs); // Use the updated tabs

        // Sync selected tabs with existing tabs
        const existingTabIds = message.tabs.map(tab => tab.id).filter((id): id is number => id !== undefined);
        syncWithExistingTabs(existingTabIds);
      } else if (message.type === 'BACKGROUND_INITIALIZED') {
        devLog(`${new Date()} - Background script initialized`);
      }
      // No need to handle REQUEST_INITIAL_DATA here, it's sent from client
    },
    [updateTabGroups, syncWithExistingTabs]
  );

  // Sync sequenceActive with its ref
  useEffect(() => {
    sequenceActiveRef.current = sequenceActive;
  }, [sequenceActive]);

  // Use the custom hook to manage the connection
  const { sendMessage, isConnected } = useBackgroundConnection<BackgroundMessage>('manager', handleBackgroundMessage);

  // Effect to request initial data once connected
  useEffect(() => {
    if (isConnected) {
      devLog(`${new Date()} - Connection established, requesting initial data...`);
      sendMessage({ type: 'REQUEST_INITIAL_DATA' });
    }
  }, [isConnected, sendMessage]);

  // Window Group focus handler
  const handleWindowGroupFocus = useCallback(
    (digit: string) => {
      let targetElement: HTMLElement | null = null;

      if (digit === '0') {
        // Current Window handling
        targetElement = document.querySelector(`[data-window-id="${activeWindowId}"]`) as HTMLElement;
      } else {
        // 1-9 handling - use the digit directly as the window group number
        const targetIndex = parseInt(digit, 10);
        targetElement = document.querySelector(`[data-window-group-number="${targetIndex}"]`) as HTMLElement;
      }

      if (targetElement) {
        // Open collapse if closed
        const collapseInput = targetElement.querySelector('input[type="checkbox"]') as HTMLInputElement;

        if (collapseInput && !collapseInput.checked) {
          collapseInput.checked = true;
        }

        // Focus first tab item (always exists due to WindowGroupList filtering)
        const firstTab = targetElement.querySelector('.collapse-content li[tabindex="0"]') as HTMLElement;
        firstTab.focus();
        // Smooth scroll into view
        firstTab.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    },
    [activeWindowId]
  );

  // Define handleKeyDown with useCallback to maintain stable reference
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if input element is focused
      const activeElement = document.activeElement;
      const isCheckbox = activeElement?.tagName === 'INPUT' && (activeElement as HTMLInputElement).type === 'checkbox';

      // Allow keyboard shortcuts for checkboxes, but not for other inputs
      if (
        activeElement &&
        !isCheckbox && // Checkboxes are excluded to allow keyboard shortcuts
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          activeElement.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      // Ignore repeat events (long press)
      if (event.repeat) {
        return;
      }

      // Handle '/' for search bar focus
      if (event.key === '/') {
        // Focus on the search bar if it's not already focused.
        if (document.activeElement?.id !== 'search-bar') {
          searchBarRef.current?.focus();
          event.preventDefault(); // Prevent the default '/' input - Why: To prevent the '/' from being entered into the search bar.
        }
        return;
      }

      // Handle ESC key to cancel sequence
      if (event.key === 'Escape' && sequenceActiveRef.current) {
        event.preventDefault();
        setSequenceActive(false);
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
          sequenceTimeoutRef.current = null;
        }
        return;
      }

      // Start sequence with 'w' key
      if (event.key === 'w' && !sequenceActiveRef.current) {
        event.preventDefault();
        setSequenceActive(true);

        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
        }
        sequenceTimeoutRef.current = setTimeout(() => {
          setSequenceActive(false);
        }, WINDOW_GROUP_SEQUENCE_TIMEOUT_MS);
        return;
      }

      // Handle number keys when sequence is active
      if (sequenceActiveRef.current && /^[0-9]$/.test(event.key)) {
        event.preventDefault();
        handleWindowGroupFocus(event.key);

        // End sequence
        setSequenceActive(false);
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
          sequenceTimeoutRef.current = null;
        }
      }
    },
    [handleWindowGroupFocus]
  );

  // Effect for getting current window ID and setting up keydown listener
  useEffect(() => {
    chrome.windows.getCurrent().then(window => {
      if (window.id !== undefined) {
        setActiveWindowId(window.id);
      }
    });

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, [handleKeyDown]); // Depend only on handleKeyDown

  const handleSearchQueryChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      // Clear selection only if the search query is not empty
      if (query !== '') {
        clearSelection();
      }
    },
    [clearSelection]
  );

  const filteredTabGroups = useMemo(
    () =>
      tabGroups
        .map((group, index) => ({ ...group, windowGroupNumber: index }))
        .map(group => ({
          ...group,
          tabs: group.tabs.filter(tab =>
            ['title', 'url'].some(target => {
              const value = (tab as Tabs.Tab)[target as keyof Tabs.Tab];
              return typeof value === 'string' && value.toLowerCase().includes(searchQuery.toLowerCase());
            })
          ) as chrome.tabs.Tab[],
        })) satisfies { windowId: number; tabs: chrome.tabs.Tab[]; windowGroupNumber: number }[], // Enforce chrome.tabs.Tab[] type.
    [tabGroups, searchQuery]
  );

  return (
    <TabFocusProvider>
      <Header
        searchQuery={searchQuery}
        onSearchQueryChange={handleSearchQueryChange}
        searchBarRef={searchBarRef}
        tabGroups={tabGroups}
      />
      <div className="p-5 pt-0">
        <WindowGroupList filteredTabGroups={filteredTabGroups} activeWindowId={activeWindowId} />
      </div>
      {sequenceActive && (
        <div className="fixed bottom-4 right-4 badge badge-soft badge-primary badge-jump-to-window-group">
          Press 0-9 to jump to Window Group
        </div>
      )}
    </TabFocusProvider>
  );
};

export default Manager;
