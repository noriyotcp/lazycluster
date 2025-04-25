# ADR 0008: Implement Toast Notification for Error Handling

## Context

In the current application, error handling feedback to users is limited to console logs, which are not visible to end users. This leads to poor user experience when errors occur, such as failing to close a tab. To improve user feedback and make error states more transparent, a user-friendly notification system is required.

## Decision

We decided to implement a toast notification system using the daisyUI toast component combined with a React Context and Provider pattern. This approach allows any component in the application to trigger toast notifications easily.

Specifically, the toast system will:

- Use a `ToastProvider` component to manage toast state and timers.
- Expose a `useToast` hook for components to show and hide toasts.
- Display error messages in a visually distinct toast using daisyUI's alert styles.
- Automatically dismiss toasts after a configurable duration.
- Be integrated initially in the `TabItem` component to notify users when closing a tab fails.

## Consequences

- Users will receive immediate visual feedback when errors occur, improving usability.
- The toast system is extensible and can be used for other notifications beyond errors.
- Additional dependencies are minimal since daisyUI is already used for styling.
- Requires wrapping the app root component with `ToastProvider` to enable context usage.

## Implementation Notes

- The `ToastProvider` component manages an array of toasts and their timers.
- The `useToast` hook provides `showToast` and `hideToast` functions.
- In `TabItem.tsx`, the `handleCloseButtonClick` function will call `showToast` with an error message if `chrome.runtime.lastError` is detected.
- Toasts will be styled with `alert alert-error` classes from daisyUI for error visibility.
- Toasts will appear in the bottom-right corner of the screen and auto-dismiss after 5 seconds by default.

## References

- daisyUI Toast Component: https://daisyui.com/components/toast/
- React Context API for global state management
