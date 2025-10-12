/**
 * Type definitions for Window Group Navigation
 */

/**
 * Configuration for window group navigation
 */
export interface WindowGroupNavigationConfig {
  /** Timeout in milliseconds before auto-canceling sequence */
  timeoutMs: number;
}

/**
 * State returned by useWindowGroupNavigation hook
 */
export interface WindowGroupNavigationState {
  /** Whether navigation sequence is active */
  sequenceActive: boolean;
  /** Current input buffer (accumulated digits) */
  inputBuffer: string;
}

/**
 * Keyboard event handler refs
 */
export interface KeyboardEventHandlerRefs {
  /** Search bar ref for focus management */
  searchBarRef: React.RefObject<HTMLInputElement>;
}

/**
 * Parsed navigation key types
 */
export type NavigationKey =
  | { type: 'START_SEQUENCE' }
  | { type: 'CANCEL' }
  | { type: 'CONFIRM' }
  | { type: 'DELETE' }
  | { type: 'DIGIT'; value: string }
  | { type: 'SEARCH_FOCUS' }
  | { type: 'HELP' };
