# 0001 - Use Port Connection for Tab List Loading

## Status

Accepted

## Context

The manager page was not displaying the tab list immediately upon opening. It only displayed the tab list after a tab update event (e.g., creating, updating, or removing a tab). This was because the manager page was only listening for `UPDATE_TABS` messages, which were only sent on tab update events.

Additionally, a "Could not establish connection" error was occurring because the background script was sometimes sending `UPDATE_TABS` messages before the manager page was fully loaded and listening for messages.

## Decision

We decided to use `chrome.runtime.connect` to establish a persistent connection between the manager page and the background script. This allows the manager page to request the initial tab list when it is opened, and it ensures that the background script only sends `UPDATE_TABS` messages when the manager page is connected.

The manager page now:

1.  Establishes a connection to the background script using `chrome.runtime.connect`.
2.  Listens for `UPDATE_TABS` messages through the connected port.
3.  Sends a `REQUEST_INITIAL_DATA` message through the connected port to request the initial tab list.

The background script now:

1.  Listens for connections from the manager page using `chrome.runtime.onConnect`.
2.  When a connection is established, it listens for `REQUEST_INITIAL_DATA` messages through the connected port.
3.  When a `REQUEST_INITIAL_DATA` message is received, it sends the current tab list to the manager page through the connected port.
4.  It also sends `UPDATE_TABS` messages through the connected port whenever the tab list changes (e.g., on tab create, update, or remove).

## Consequences

### Positive

- The manager page now displays the tab list immediately upon opening.
- The "Could not establish connection" error is resolved.
- The communication between the manager page and the background script is more reliable.

### Negative

- The code is more complex than the previous implementation.
- It requires a persistent connection between the manager page and the background script, which may consume more resources.
