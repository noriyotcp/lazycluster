/**
 * Pure utility functions for Window Group Navigation
 */

import type { NavigationKey } from '../types/windowGroupNavigation';

/**
 * Validate if a digit can be added to the input buffer
 * "0" is reserved for Current Window, so "01", "002" are invalid
 *
 * @param currentBuffer - Current input buffer
 * @param _digit - Digit to add (0-9) - currently unused but kept for API consistency
 * @returns true if valid, false otherwise
 */
export function canAddDigitToBuffer(currentBuffer: string, _digit: string): boolean {
  // Reject digits after "0" (Current Window is "0" only)
  if (currentBuffer === '0') {
    return false;
  }
  return true;
}

/**
 * Check if the active element should prevent keyboard shortcuts
 * Allows checkboxes but blocks other input elements
 *
 * @param activeElement - Currently focused element
 * @returns true if shortcuts should be blocked
 */
export function shouldBlockKeyboardShortcut(activeElement: Element | null): boolean {
  if (!activeElement) {
    return false;
  }

  const isCheckbox =
    activeElement.tagName === 'INPUT' &&
    (activeElement as HTMLInputElement).type === 'checkbox';

  // Allow keyboard shortcuts for checkboxes
  if (isCheckbox) {
    return false;
  }

  // Block for other input elements
  return (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.tagName === 'SELECT' ||
    activeElement.getAttribute('contenteditable') === 'true'
  );
}

/**
 * Parse keyboard event to extract relevant navigation key
 *
 * @param event - Keyboard event
 * @returns Navigation key type or null
 */
export function parseNavigationKey(event: KeyboardEvent): NavigationKey | null {
  if (event.key === 'w') return { type: 'START_SEQUENCE' };
  if (event.key === 'Escape') return { type: 'CANCEL' };
  if (event.key === 'Enter') return { type: 'CONFIRM' };
  if (event.key === 'Backspace') return { type: 'DELETE' };
  if (/^[0-9]$/.test(event.key)) return { type: 'DIGIT', value: event.key };
  if (event.key === '/') return { type: 'SEARCH_FOCUS' };
  if (event.key === '?') return { type: 'HELP' };
  return null;
}
