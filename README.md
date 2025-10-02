# LazyCluster

A Chrome extension for enhanced tab and window management, inspired by the original "[cluster](https://chromewebstore.google.com/detail/cluster-window-tab-manage/aadahadfdmiibmdhfmpbeeebejmjnkef)" extension.

## Features

- **Effortless Bulk Tab Management:** Quickly select and close multiple tabs across all windows or within specific windows, saving time and reducing clutter.
  - Global Bulk Close: Close tabs from any window with a single action.
  - Window-Specific Bulk Close: Target tabs within a particular window for closing.
  - Real-time Selection Sync: Tab selection automatically updates when tabs are closed from anywhere (browser UI, other extensions, etc.)
- **Visual Tab Metrics:** Stay informed about your tab usage with visual badges:
  - Tab Count Badges: See the number of tabs in each window and total across all windows
  - Selection Counter: Real-time display of how many tabs you have selected
  - Tab Group Colors: Visual indicators showing Chrome tab group colors on the left border of each tab
- **Intuitive Keyboard Navigation:** Navigate and select tabs efficiently using familiar keyboard shortcuts for a smooth workflow:
  - `?`: Show keyboard shortcuts help modal
  - `j/k`: Navigate up/down through tabs
  - `Shift+h/l`: Jump to first/last tab in current window group (vim-style: High/Low)
  - `Shift+m`: Jump to middle tab in current window group (vim-style: Middle)
  - `Space`: Toggle tab selection
  - `w + [0-9]`: Quick jump to Window Groups
    - `w` then `1-9`: Jump to specific Window Group
    - `w` then `0`: Jump to current window
    - `ESC`: Cancel the sequence
    - Sequence times out after 3 seconds
  - `/`: Focus search bar
- **Quick Domain Access:** Easily see and access a tab's domain by hovering, even when the title is long, providing quick context and navigation.
- **Streamlined Selection:** Simple checkboxes allow for easy individual or window-wide tab selection for bulk actions.

## Overview

LazyCluster provides a streamlined and intuitive way to manage your browser tabs and windows. Easily list, search, and close tabs with a clean interface. Tabs are organized by window, and a search bar helps you quickly find what you need. The manager page is designed to be responsive, adapting to different screen sizes, with a sticky header for easy access to key actions like search and bulk closing.

## Technologies Used

- [WXT](https://wxt.dev/): A modern web extension framework that streamlines development with Vite.
- [React](https://react.dev/): A JavaScript library for building user interfaces.
- [TypeScript](https://www.typescriptlang.org/): A typed superset of JavaScript for enhanced code quality and maintainability.
- [daisyUI](https://daisyui.com/): A Tailwind CSS component library that provides ready-to-use UI components for faster development with cleaner HTML. It's pure CSS and works with all frameworks.
