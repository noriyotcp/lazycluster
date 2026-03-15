import { useEffect, useState, useRef, useCallback } from 'react';
import { devLog } from '../../src/utils/devLog';
import Header from '../../src/components/Header';
import type { ViewMode } from '../../src/components/Header';
import WindowGroupList from '../../src/components/WindowGroupList';
import DuplicatesView from '../../src/components/DuplicatesView';
import InactivesView from '../../src/components/InactivesView';
import { TabFocusProvider } from '../../src/contexts/TabFocusContext';
import { useTabGroupContext } from '../../src/contexts/TabGroupContext';
import { useTabSelectionContext } from '../../src/contexts/TabSelectionContext';
import { useDeletionState } from '../../src/contexts/DeletionStateContext';
import { useTabGroupColor } from '../../src/contexts/TabGroupColorContext';
import { useBackgroundConnection } from '../../src/hooks/useBackgroundConnection';
import { useWindowGroupNavigation } from '../../src/hooks/useWindowGroupNavigation';
import { useActiveWindowId } from '../../src/contexts/ActiveWindowIdContext';
import KeyboardShortcutsModal from '../../src/components/KeyboardShortcutsModal';
import './style.css';

// Define a more specific message type based on BaseMessage from the hook
interface BackgroundMessage {
  type: 'UPDATE_TABS' | 'BACKGROUND_INITIALIZED' | 'REQUEST_INITIAL_DATA'; // Known types
  tabs?: chrome.tabs.Tab[]; // Make tabs optional as it's not always present
  payload?: unknown; // Keep payload flexible if needed
}

const getViewFromHash = (): ViewMode => {
  const hash = window.location.hash.slice(1);
  if (hash === 'duplicates' || hash === 'inactives') return hash;
  return 'tabs';
};

const Manager = () => {
  const { tabGroups, updateTabGroups } = useTabGroupContext();
  const { clearSelection, syncWithExistingTabs } = useTabSelectionContext();
  const { cleanupNonExistentItems } = useDeletionState();
  const { updateGroupColors } = useTabGroupColor();
  const { activeWindowId, refreshActiveWindowId } = useActiveWindowId();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allTabs, setAllTabs] = useState<chrome.tabs.Tab[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(getViewFromHash);
  const searchBarRef = useRef<HTMLInputElement>(null);

  // Sync viewMode with URL hash
  const changeView = useCallback((view: ViewMode) => {
    setViewMode(view);
    window.location.hash = view === 'tabs' ? '' : view;
  }, []);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      setViewMode(getViewFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Define the message handler using useCallback to maintain reference stability
  const handleBackgroundMessage = useCallback(
    async (message: BackgroundMessage) => {
      devLog(`${new Date()} - Received message from background:`, message); // Log received messages
      if (message.type === 'UPDATE_TABS' && message.tabs) {
        setAllTabs(message.tabs);
        const currentWindowId = await refreshActiveWindowId();
        updateTabGroups(message.tabs, currentWindowId ?? undefined); // Use the updated tabs

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
    [updateTabGroups, syncWithExistingTabs, cleanupNonExistentItems, updateGroupColors, refreshActiveWindowId]
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

  // Map windowId to display label (Current Window / Window 1, 2, ...)
  const windowLabels = new Map<number, string>();
  tabGroups.forEach((group, index) => {
    windowLabels.set(group.windowId, index === 0 ? 'Current Window' : `Window ${index}`);
  });

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
      <Header
        searchQuery={searchQuery}
        onSearchQueryChange={handleSearchQueryChange}
        searchBarRef={searchBarRef}
        allTabs={allTabs}
        viewMode={viewMode}
        onViewChange={changeView}
      />
      <div className="p-5 pt-0">
        {viewMode === 'tabs' && (
          <WindowGroupList
            filteredTabGroups={filteredTabGroups}
            isFiltered={searchQuery !== ''}
          />
        )}
        {viewMode === 'duplicates' && (
          <DuplicatesView allTabs={allTabs} windowLabels={windowLabels} onBack={() => changeView('tabs')} />
        )}
        {viewMode === 'inactives' && (
          <InactivesView allTabs={allTabs} windowLabels={windowLabels} onBack={() => changeView('tabs')} />
        )}
      </div>
      {sequenceActive && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 badge badge-soft badge-primary badge-jump-to-window-group">
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
