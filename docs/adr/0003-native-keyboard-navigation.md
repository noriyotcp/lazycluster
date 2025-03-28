# Implement Native Keyboard Navigation for TabList

## Status

Accepted

## Context

Initially, we considered using the [@github/hotkey](https://github.com/github/hotkey) library to bind keyboard shortcuts for navigating among TabItems in the manager tab. However, after evaluating the requirements, it was determined that our goal was solely to shift focus between TabItems within a list—without switching the active tab at the browser level. Using a full-featured hotkey library would have introduced unnecessary complexity.

## Decision

We decided to implement keyboard navigation using a custom, native `onKeyDown` event handler within the TabList component. Key points of the implementation include:

- **DOM Reference:**  
  A React ref (`listRef`) is utilized to access the UL element containing the TabItems. This allows direct querying of focusable LI elements.

- **Event Listener:**  
  A `keydown` event listener is added to the UL element to monitor keyboard input when the focus is within this list.

- **Focus Management:**  
  The event handler determines which TabItem is currently focused and calculates the next item to focus based on the key pressed:

  - **'k':** Moves focus to the previous TabItem (with wrapping).
  - **'j':** Moves focus to the next TabItem (with wrapping).
  - **'g':** Implements detection of a double press ("gg") within a 500ms window to move focus to the first TabItem; if Shift is held, focus moves to the last TabItem.
  - **'G':** Moves focus to the last TabItem.

- **Cleanup:**  
  The event listener is removed on component unmount to prevent memory leaks.

This solution leverages native browser events for a simpler, more maintainable approach, aligning perfectly with our specific requirements.

## Consequences

**Positive:**

- A simplified implementation focused solely on managing DOM focus within the TabList component.
- Reduced complexity by avoiding an external dependency that provides additional features not needed for this task.
- Easier to maintain and update given the straightforward nature of the code.

**Negative:**

- Limited flexibility compared to a full-featured hotkey library which might offer additional functionalities in more complex scenarios.
