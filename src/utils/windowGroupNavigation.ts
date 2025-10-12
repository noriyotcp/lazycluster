/**
 * Pure utility functions for Window Group Navigation
 */

import type { NavigationKey } from '../types/windowGroupNavigation';

/**
 * Validate if a digit can be added to the input buffer
 * "0" is reserved for Current Window, so "01", "002" are invalid
 *
 * @param currentBuffer - Current input buffer
 * @returns true if valid, false otherwise
 */
export function canAddDigitToBuffer(currentBuffer: string): boolean {
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

/**
 * Get the target window group element to focus
 *
 * @param input - Input buffer ("0" for current window, "1-999" for window groups)
 * @param activeWindowId - Current window ID (for "0" handling)
 * @returns Target HTML element or null if not found
 */
export function getWindowGroupElement(
  input: string,
  activeWindowId: number | null,
  doc: Document = document
): HTMLElement | null {
  if (input === '0') {
    // Current Window handling
    return doc.querySelector(`[data-window-id="${activeWindowId}"]`);
  } else {
    // Window Group 1-9, 10-99, 100-999, etc.
    const targetIndex = parseInt(input, 10);
    return doc.querySelector(`[data-window-group-number="${targetIndex}"]`);
  }
}

/**
 * Focus on a window group and scroll it into view
 * Opens collapsed group if needed
 *
 * @param targetElement - Window group element to focus
 */
export function focusAndScrollToWindowGroup(targetElement: HTMLElement): void {
  // Open collapse if closed
  const collapseInput = targetElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
  if (collapseInput && !collapseInput.checked) {
    collapseInput.checked = true;
  }

  // Focus first tab item (guaranteed by WindowGroupList filtering)
  const firstTab = targetElement.querySelector('.collapse-content li[tabindex="0"]') as HTMLElement;
  if (firstTab) {
    firstTab.focus();
    // Smooth scroll into view
    firstTab.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }
}
