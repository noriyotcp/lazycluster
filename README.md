# LazyCluster

A Chrome extension for enhanced tab and window management, inspired by the original "cluster" extension.

## Overview

LazyCluster aims to provide a streamlined and intuitive interface for managing your browser tabs and windows. It allows you to easily list, search, filter, sort, move, close, suspend, and discard tabs, as well as save and restore sessions. Tabs in the manager tab are now grouped by window for better organization. The manager page also includes a search bar to filter tabs by title.
**The manager page now features a responsive 2-column layout for window groups, implemented using the `column-count` CSS property.**

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
