import { useEffect, useState, useRef, useCallback } from 'react'; // Add useCallback
import { devLog } from '../../src/utils/devLog';
import Header from '../../src/components/Header';
import WindowGroupList from '../../src/components/WindowGroupList';
import { TabFocusProvider } from '../../src/contexts/TabFocusContext';
import { useTabGroupContext } from '../../src/contexts/TabGroupContext';
import { useTabSelectionContext } from '../../src/contexts/TabSelectionContext'; // Import TabSelectionContext
import { useDeletionState } from '../../src/contexts/DeletionStateContext'; // Import DeletionStateContext
import { useTabGroupColor } from '../../src/contexts/TabGroupColorContext'; // Import TabGroupColorContext
import { useBackgroundConnection } from '../../src/hooks/useBackgroundConnection'; // Import the hook
import { useWindowGroupNavigation } from '../../src/hooks/useWindowGroupNavigation'; // Import window navigation hook
import KeyboardShortcutsModal from '../../src/components/KeyboardShortcutsModal';
import './style.css';

// Define a more specific message type based on BaseMessage from the hook
interface BackgroundMessage {
  type: 'UPDATE_TABS' | 'BACKGROUND_INITIALIZED' | 'REQUEST_INITIAL_DATA'; // Known types
  tabs?: chrome.tabs.Tab[]; // Make tabs optional as it's not always present
  payload?: unknown; // Keep payload flexible if needed
}

const Manager = () => {
  const { tabGroups, updateTabGroups } = useTabGroupContext();
  const { clearSelection, syncWithExistingTabs } = useTabSelectionContext();
  const { cleanupNonExistentItems } = useDeletionState();
  const { updateGroupColors } = useTabGroupColor();
  const [activeWindowId, setActiveWindowId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchBarRef = useRef<HTMLInputElement>(null);

  // Define the message handler using useCallback to maintain reference stability
  const handleBackgroundMessage = useCallback(
    (message: BackgroundMessage) => {
      devLog(`${new Date()} - Received message from background:`, message); // Log received messages
      if (message.type === 'UPDATE_TABS' && message.tabs) {
        updateTabGroups(message.tabs); // Use the updated tabs

        // Update group colors
        updateGroupColors(message.tabs);

        // Sync selected tabs with existing tabs
        const existingTabIds = message.tabs.map(tab => tab.id).filter((id): id is number => id !== undefined);
        syncWithExistingTabs(existingTabIds);

        // Clean up deletion state for non-existent items
        const existingWindowIds = [
          ...new Set(message.tabs.map(tab => tab.windowId).filter((id): id is number => id !== undefined)),
        ];
        cleanupNonExistentItems({ existingTabIds, existingWindowIds });
      } else if (message.type === 'BACKGROUND_INITIALIZED') {
        devLog(`${new Date()} - Background script initialized`);
      }
      // No need to handle REQUEST_INITIAL_DATA here, it's sent from client
    },
    [updateTabGroups, syncWithExistingTabs, cleanupNonExistentItems, updateGroupColors]
  );

  // Use the custom hook to manage the connection
  const { sendMessage, isConnected } = useBackgroundConnection<BackgroundMessage>('manager', handleBackgroundMessage);

  // Effect to request initial data once connected
  useEffect(() => {
    if (isConnected) {
      devLog(`${new Date()} - Connection established, requesting initial data...`);
      sendMessage({ type: 'REQUEST_INITIAL_DATA' });
    }
  }, [isConnected, sendMessage]);

  // Window Group Navigation
  const { sequenceActive, inputBuffer } = useWindowGroupNavigation(activeWindowId, { searchBarRef });

  // Effect for initial activeWindowId setup on mount
  useEffect(() => {
    chrome.windows.getCurrent().then(window => {
      if (window.id !== undefined) {
        setActiveWindowId(window.id);
      }
    });
  }, []); // Run once on mount

  // Effect to update activeWindowId when tabGroups changes (e.g., when tab is moved to another window)
  useEffect(() => {
    chrome.windows.getCurrent().then(window => {
      if (window.id !== undefined) {
        setActiveWindowId(window.id);
      }
    });
  }, [tabGroups]); // Update whenever tabs change

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

  const filteredTabGroups = tabGroups
    .map((group, index) => ({ ...group, windowGroupNumber: index }))
    .map(group => ({
      ...group,
      tabs: group.tabs.filter(tab =>
        ['title', 'url'].some(target => {
          const value = (tab as chrome.tabs.Tab)[target as keyof chrome.tabs.Tab];
          return typeof value === 'string' && value.toLowerCase().includes(searchQuery.toLowerCase());
        })
      ) as chrome.tabs.Tab[],
    })) satisfies { windowId: number; tabs: chrome.tabs.Tab[]; windowGroupNumber: number }[]; // Enforce chrome.tabs.Tab[] type.

  return (
    <TabFocusProvider>
      <Header searchQuery={searchQuery} onSearchQueryChange={handleSearchQueryChange} searchBarRef={searchBarRef} />
      <div className="p-5 pt-0">
        <WindowGroupList
          filteredTabGroups={filteredTabGroups}
          activeWindowId={activeWindowId}
          isFiltered={searchQuery !== ''}
        />
      </div>
      {sequenceActive && (
        <div className="fixed bottom-4 right-4 badge badge-soft badge-primary badge-jump-to-window-group">
          {inputBuffer.length === 0 ? (
            'Type window group number'
          ) : (
            <>
              Jump to: <strong>{inputBuffer}</strong> + <kbd className="kbd kbd-sm">Enter</kbd>
            </>
          )}
        </div>
      )}
      <KeyboardShortcutsModal />
    </TabFocusProvider>
  );
};

export default Manager;
