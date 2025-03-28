## Implementation Plan and Rationale for Keyboard Navigation in TabList

**Objective**  
Implement keyboard navigation within the manager tab to allow users to move focus between TabItems using the keys ‘k’, ‘j’, ‘gg’, and ‘G’. The focus movement is handled through the native DOM `focus()` method rather than switching active tabs using functions like `focusActiveTab()`.

**Initial Consideration**  
We initially considered using the @github/hotkey library to bind hotkeys to DOM elements, but this proved to be more complex than necessary. Since our goal is to simply shift focus among the TabItems in the manager tab, using a custom `onKeyDown` event handler is a simpler, more maintainable solution.

**Implementation Details**

1. **DOM Reference**

   - A `listRef` is created using `useRef` to hold a reference to the UL element that contains the TabItems. This allows direct access to the DOM node for querying focusable children.

2. **Event Listener with onKeyDown**

   - A `useEffect` hook is used to attach a `keydown` event listener to the UL element. This listener monitors key events when the UL (or one of its child TabItems) is focused.
   - When a key is pressed, the event handler first checks if the currently focused element is within the list.

3. **Determining the Active Element and TabItems**

   - The handler retrieves the active element using `document.activeElement` and ensures it is contained within the list.
   - It then gathers all LI elements with `tabindex="0"` (making them focusable) into an array (`tabItems`) and determines the index of the currently focused element.

4. **Calculating the Next Focus Index**

   - Depending on the key pressed:
     - **'k':** Moves the focus to the previous TabItem. The index wraps around to the last TabItem if the current focus is on the first element.
     - **'j':** Moves the focus to the next TabItem, with similar wrapping behavior.
     - **'g':** This key supports detecting a double press ('gg'). The handler stores a timestamp and the last key pressed. If a second 'g' is detected within 500 milliseconds, it is recognized as “gg” and moves the focus to the first TabItem. If the Shift key is also pressed, the focus moves to the last TabItem.
     - **'G':** Directly moves the focus to the last TabItem.
   - After determining the appropriate next index, the handler calls `event.preventDefault()`, and then sets focus on the target TabItem via its `focus()` method.

5. **Cleanup**
   - The event listener is removed in the cleanup function of the `useEffect` to prevent any potential memory leaks.

**Conclusion**  
This implementation leverages a custom onKeyDown handler to provide intuitive keyboard navigation without the overhead of using an external hotkey library. It prioritizes a simple, maintainable approach while ensuring that edge cases—such as detecting a double press for "gg"—are appropriately handled.

By separating the focus navigation logic into a dedicated and self-contained mechanism, this solution remains flexible and clearly documents both the design decision and technical approach for future reference.
