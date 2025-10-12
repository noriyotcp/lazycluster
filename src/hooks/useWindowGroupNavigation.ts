import { useEffect, useRef, useCallback, useState } from 'react';
import {
  canAddDigitToBuffer,
  shouldBlockKeyboardShortcut,
  getWindowGroupElement,
  focusAndScrollToWindowGroup,
  parseNavigationKey,
} from '../utils/windowGroupNavigation';
import type {
  WindowGroupNavigationConfig,
  WindowGroupNavigationState,
  KeyboardEventHandlerRefs,
} from '../types/windowGroupNavigation';

const DEFAULT_CONFIG: WindowGroupNavigationConfig = {
  timeoutMs: 3000, // 3 seconds
};

/**
 * Custom hook to manage window group navigation via keyboard shortcuts
 * Handles the "w + <number> + Enter" sequence for jumping to window groups
 *
 * @param activeWindowId - Currently active window ID
 * @param refs - Refs for keyboard event handling (searchBarRef)
 * @param config - Optional configuration
 * @returns Navigation state (sequenceActive, inputBuffer)
 *
 * @example
 * ```tsx
 * const { sequenceActive, inputBuffer } = useWindowGroupNavigation(
 *   activeWindowId,
 *   { searchBarRef }
 * );
 * ```
 */
export function useWindowGroupNavigation(
  activeWindowId: number | null,
  { searchBarRef }: KeyboardEventHandlerRefs,
  config: Partial<WindowGroupNavigationConfig> = {}
): WindowGroupNavigationState {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // State management
  const [sequenceActive, setSequenceActive] = useState<boolean>(false);
  const [inputBuffer, setInputBuffer] = useState<string>('');

  // Refs for avoiding stale closure issues
  const sequenceTimeoutRef = useRef<number | null>(null);
  const sequenceActiveRef = useRef<boolean>(false);
  const inputBufferRef = useRef<string>('');

  // Sync state with refs
  useEffect(() => {
    sequenceActiveRef.current = sequenceActive;
  }, [sequenceActive]);

  useEffect(() => {
    inputBufferRef.current = inputBuffer;
  }, [inputBuffer]);

  // Debounce helper: Reset and restart sequence timeout
  const resetSequenceTimeout = useCallback(() => {
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
    }

    sequenceTimeoutRef.current = setTimeout(() => {
      setSequenceActive(false);
      setInputBuffer('');
    }, finalConfig.timeoutMs);
  }, [finalConfig.timeoutMs]);

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

  // Main keyboard event handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const activeElement = document.activeElement;

      // Check if input element is focused (except checkboxes)
      if (shouldBlockKeyboardShortcut(activeElement)) {
        return;
      }

      // Ignore repeat events (long press)
      if (event.repeat) {
        return;
      }

      // Parse navigation key
      const navKey = parseNavigationKey(event);
      if (!navKey) {
        return; // Not a navigation key
      }

      // Handle search focus (/)
      if (navKey.type === 'SEARCH_FOCUS') {
        if (document.activeElement?.id !== 'search-bar') {
          searchBarRef.current?.focus();
          event.preventDefault();
        }
        return;
      }

      // Handle help modal (?)
      if (navKey.type === 'HELP') {
        event.preventDefault();
        const modal = document.getElementById('keyboard-shortcuts-modal') as HTMLDialogElement;
        if (modal) {
          modal.showModal();
        }
        return;
      }

      // Handle sequence cancellation (ESC)
      if (navKey.type === 'CANCEL' && sequenceActiveRef.current) {
        event.preventDefault();
        setSequenceActive(false);
        setInputBuffer('');
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
          sequenceTimeoutRef.current = null;
        }
        return;
      }

      // Start sequence with 'w' key
      if (navKey.type === 'START_SEQUENCE' && !sequenceActiveRef.current) {
        event.preventDefault();
        setSequenceActive(true);
        setInputBuffer('');
        resetSequenceTimeout();
        return;
      }

      // Handle digit input during sequence
      if (navKey.type === 'DIGIT' && sequenceActiveRef.current) {
        event.preventDefault();

        // Validate digit addition
        if (!canAddDigitToBuffer(inputBufferRef.current, navKey.value)) {
          return;
        }

        setInputBuffer(prev => prev + navKey.value);
        resetSequenceTimeout();
        return;
      }

      // Handle Enter key to confirm and jump
      if (navKey.type === 'CONFIRM' && sequenceActiveRef.current) {
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

      // Handle Backspace to delete last digit
      if (navKey.type === 'DELETE' && sequenceActiveRef.current) {
        event.preventDefault();
        setInputBuffer(prev => prev.slice(0, -1));
        resetSequenceTimeout();
        return;
      }
    },
    [handleWindowGroupFocus, resetSequenceTimeout, searchBarRef]
  );

  // Setup keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, [handleKeyDown]);

  return {
    sequenceActive,
    inputBuffer,
  };
}
