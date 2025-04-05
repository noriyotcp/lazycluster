# LazyCluster

A Chrome extension for enhanced tab and window management, inspired by the original "cluster" extension.

## E2E Testing

This project uses Playwright for end-to-end testing.

### Setup

- Configure `fixtures.ts` with the correct extension path.
- Use `path.resolve` to dynamically resolve the extension path.

### Error Handling

- Be aware of `__dirname` errors when resolving paths.
- Check for test timeouts and adjust configurations accordingly.

### Test Examples

- `popup-display.spec.ts` provides an example of testing the popup UI.

## Features

- **Bulk Tab Selection and Actions:**

  - **Global Bulk Close:**
    - Select tabs across multiple windows and close them all at once using the "trash" icon in the header.
  - **Window-Specific Bulk Close:**
    - Select tabs within a specific window and close them using the "Close Tabs" button in the Window Actions of each window group.
  - **Keyboard Navigation:**
    - Navigate through the tab list using 'j' (next), 'k' (previous), 'gg' (top), and 'G' (bottom) keys.
  - **Window Bulk Select:**
    - Checkbox in Window Actions to select/deselect all tabs within the window group.
  - Use checkboxes in each tab item to select tabs for bulk close actions.

- **Tab Hover Domain Display:** When hovering over a tab, the tab's domain is displayed as a clickable link, enabling access even when the title is truncated.

## Overview

LazyCluster aims to provide a streamlined and intuitive interface for managing your browser tabs and windows. It allows you to easily list, search, and close tabs. Tabs in the manager tab are now grouped by window for better organization. The manager page also includes a search bar to filter tabs by title and URL, and now features a responsive 2-column layout for window groups that activates at the `lg:` breakpoint.
The header is now sticky, always staying at the top of the page for easy access to search and theme switch and bulk tab closing.
**The manager page now features a responsive 2-column layout for window groups, implemented using Tailwind CSS grid.**

## Technologies Used

- [WXT](https://wxt.dev/): A modern web extension framework that streamlines development with Vite.
- [React](https://react.dev/): A JavaScript library for building user interfaces.
- [TypeScript](https://www.typescriptlang.org/): A typed superset of JavaScript for enhanced code quality and maintainability.
- [Vite](https://vitejs.dev/): A fast and efficient build tool.
- Tailwind CSS (Conceptual): A utility-first CSS framework.
- Shadcn UI (Conceptual): A collection of accessible and reusable components.
- Chrome Extension APIs: For core extension functionality.

## Development Plan

1.  **Basic Setup:** Configure manifest settings and project structure using WXT.
2.  **Popup UI:** Implement the popup UI with a "Window Manager" button that opens the main UI in a new pinned tab.
3.  **Manager Page:** Create the main UI (manager.html) to display and manage tabs and windows.
4.  **Background Service Worker:** Implement the core extension logic for tab and window management.
5.  **Settings Page:** (Future) Implement a settings page for customization.
6.  **Testing and Debugging:** Thoroughly test all features in Chrome.
7.  **Documentation:** Document the development process and architectural decisions.
