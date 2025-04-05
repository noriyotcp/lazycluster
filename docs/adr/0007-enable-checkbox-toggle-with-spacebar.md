# 7. Enable checkbox toggle with spacebar on focused TabItem

- Status: accepted
- Date: 2025-04-06

## Context and Problem Statement

To improve keyboard navigation and accessibility within the TabList component, users should be able to toggle the checkbox of a focused TabItem using the spacebar, similar to standard checkbox behavior. Currently, only mouse clicks can toggle the checkbox.

## Decision Drivers

- Enhance keyboard accessibility.
- Provide a more intuitive user experience for keyboard users.
- Align with standard UI patterns for checkbox interaction.

## Considered Options

- Add `onKeyDown` handler directly to the `li` element in `TabItem.tsx`.
- Handle the spacebar key press within the `TabList.tsx` component and delegate to the focused `TabItem`.

## Decision Outcome

Chosen option: "Add `onKeyDown` handler directly to the `li` element in `TabItem.tsx`", because:

- It encapsulates the keyboard interaction logic within the component responsible for the checkbox (`TabItem`).
- It simplifies the logic in `TabList.tsx`, keeping it focused on list-level navigation (j, k, g, G keys).
- It uses a `ref` (`checkboxRef`) to programmatically trigger the `click()` event on the checkbox input when the spacebar is pressed on the focused list item. This ensures the existing `onChange` handler (`handleCheckboxChange`) is correctly invoked, maintaining consistency in state updates and context interactions (`useTabSelectionContext`).

### Positive Consequences

- Improved keyboard accessibility for toggling tab selection.
- More intuitive interaction for users relying on keyboard navigation.

### Negative Consequences

- Slightly increases the complexity of `TabItem.tsx` by adding a keydown handler and a ref.

## Implementation Details

1.  Import `useRef` in `TabItem.tsx`.
2.  Create a `checkboxRef` using `useRef<HTMLInputElement>(null)`.
3.  Attach `checkboxRef` to the `input type="checkbox"` element.
4.  Implement a `handleKeyDown` function within `TabItem.tsx`:
    - Check if `e.key === ' '`.
    - If true, call `e.preventDefault()` to stop default spacebar behavior (like scrolling).
    - If `checkboxRef.current` exists, call `checkboxRef.current.click()`.
5.  Add the `onKeyDown={handleKeyDown}` prop to the root `li` element.

## Links

- Commit: 5bfd30b7168920b2a16c26126d9fdc5210583622
