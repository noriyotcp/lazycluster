## Title

Remove Redundant Tab Update in TabItem

## Status

Accepted

## Context

The application was performing redundant tab updates when a tab was closed from the TabItem component. This was because the `handleCloseButtonClick` function in `TabItem.tsx` was calling `updateTabGroups` after removing a tab, while the `background.ts` script was already listening for the `chrome.tabs.onRemoved` event and updating the tab list. This resulted in unnecessary processing and potential performance issues.

## Decision

Remove the `updateTabGroups` call from the `handleCloseButtonClick` function in `TabItem.tsx`. Rely on the `background.ts` script to handle tab updates via the `chrome.tabs.onRemoved` event.

## Consequences

- Reduced code complexity in `TabItem.tsx`.
- Improved performance by avoiding redundant tab updates.
- Simplified tab management logic by centralizing tab updates in `background.ts`.
