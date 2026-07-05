/**
 * Message contracts shared between the background service worker and the
 * manager page. Both sides import from this module so the protocol cannot
 * silently drift.
 */

/** Name of the runtime port the manager page connects with. */
export const MANAGER_PORT_NAME = 'manager';

/** Messages the background script posts to the manager over the port. */
export type BackgroundToManagerMessage =
  { type: 'UPDATE_TABS'; tabs: chrome.tabs.Tab[] } | { type: 'BACKGROUND_INITIALIZED' };

/** Messages the manager sends to the background script over the port. */
export type ManagerToBackgroundMessage = { type: 'REQUEST_INITIAL_DATA' };
