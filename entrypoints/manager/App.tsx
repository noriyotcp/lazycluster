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
import KeyboardShortcutsModal from '../../src/components/KeyboardShortcutsModal';
import {
  getWindowGroupElement,
  focusAndScrollToWindowGroup,
} from '../../src/utils/windowGroupNavigation';
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
  const { cleanupNonExistentItems } = useDeletionState();
  const { updateGroupColors } = useTabGroupColor();
  const [activeWindowId, setActiveWindowId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sequenceActive, setSequenceActive] = useState<boolean>(false);
  const [inputBuffer, setInputBuffer] = useState<string>('');
  const searchBarRef = useRef<HTMLInputElement>(null);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sequenceActiveRef = useRef<boolean>(false); // Ref to access latest sequenceActive value in event handlers to avoid stale closure issues
  const inputBufferRef = useRef<string>(''); // Ref to access latest inputBuffer value to avoid dependency array issues

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

  // Sync sequenceActive with its ref
  useEffect(() => {
    sequenceActiveRef.current = sequenceActive;
  }, [sequenceActive]);

  // Sync inputBuffer with its ref
  useEffect(() => {
    inputBufferRef.current = inputBuffer;
  }, [inputBuffer]);

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
    (input: string) => {
      const targetElement = getWindowGroupElement(input, activeWindowId);
      if (targetElement) {
        focusAndScrollToWindowGroup(targetElement);
      }
    },
    [activeWindowId]
  );

  // Debounce helper: Reset and restart the sequence timeout
  const resetSequenceTimeout = useCallback(() => {
    // Clear existing timeout
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
    }

    // Start new timeout (3 seconds)
    sequenceTimeoutRef.current = setTimeout(() => {
      setSequenceActive(false);
      setInputBuffer('');
    }, WINDOW_GROUP_SEQUENCE_TIMEOUT_MS);
  }, []);

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

      // Handle '?' (Shift + /) for keyboard shortcuts modal
      if (event.key === '?') {
        event.preventDefault();
        const modal = document.getElementById('keyboard-shortcuts-modal') as HTMLDialogElement;
        if (modal) {
          modal.showModal();
        }
        return;
      }

      // Handle ESC key to cancel sequence
      if (event.key === 'Escape' && sequenceActiveRef.current) {
        event.preventDefault();
        setSequenceActive(false);
        setInputBuffer(''); // Clear buffer on cancel
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
        setInputBuffer(''); // Clear buffer

        // Debounce timer start
        resetSequenceTimeout();
        return;
      }

      // Handle number keys when sequence is active
      if (sequenceActiveRef.current && /^[0-9]$/.test(event.key)) {
        event.preventDefault();

        // Reject if trying to add a digit after "0"
        // "0" is reserved for Current Window, don't allow "01", "002", etc.
        if (inputBufferRef.current === '0') {
          return; // Don't add to buffer
        }

        setInputBuffer(prev => prev + event.key);

        // Reset timer (Debounce - input continues sequence)
        resetSequenceTimeout();
        return;
      }

      // Handle Enter key to confirm and jump
      if (sequenceActiveRef.current && event.key === 'Enter') {
        event.preventDefault();

        if (inputBufferRef.current.length > 0) {
          handleWindowGroupFocus(inputBufferRef.current);
        }

        // End sequence
        setSequenceActive(false);
        setInputBuffer('');
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
          sequenceTimeoutRef.current = null;
        }
        return;
      }

      // Handle Backspace key to delete last digit
      if (sequenceActiveRef.current && event.key === 'Backspace') {
        event.preventDefault();
        setInputBuffer(prev => prev.slice(0, -1));

        // Reset timer (editing is active input)
        resetSequenceTimeout();
        return;
      }
    },
    [handleWindowGroupFocus, resetSequenceTimeout]
  );

  // Effect for initial activeWindowId setup on mount
  useEffect(() => {
    chrome.windows.getCurrent().then(window => {
      if (window.id !== undefined) {
        setActiveWindowId(window.id);
      }
    });
  }, []); // Run once on mount

  // Effect for keyboard event listener setup
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, [handleKeyDown]); // Depend on handleKeyDown

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
