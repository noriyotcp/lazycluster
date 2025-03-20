# System Patterns: LazyCluster

## System Architecture

LazyCluster follows a modular, component-based architecture, primarily leveraging React components for the UI and background scripts for core logic and browser API interactions. The architecture is designed to be event-driven and reactive, ensuring efficient updates and interactions between different parts of the extension.

### Component Descriptions

1.  **Manager Tab UI (React):**

    - Built using React and TypeScript, specifically `entrypoints/manager/App.tsx`.
    - Responsible for rendering the main user interface within a dedicated browser tab (the "manager tab").
    - Displays a clear overview of windows and tabs, and handles all tab and window management functionalities.
    - Composed of various UI components for displaying lists of windows and tabs, search bars, buttons, and interactive elements.
    - Handles user interactions such as drag and drop, button clicks, and search input to manage tabs and windows.
    - Communicates with the Background Script to fetch data and trigger actions.

2.  **Popup UI (React):**

    - Built using React and TypeScript, specifically `entrypoints/popup/App.tsx`.
    - Currently has a very limited role: primarily to provide a button that opens the "manager tab".
    - This popup UI is lightweight and focused on quickly directing users to the full management interface in the manager tab.
    - Communicates with the Background Script to request the opening of the manager tab.

3.  **Background Script (background.ts):**

    - The core logic of the extension resides here.
    - Manages interactions with Chrome Extension APIs to:
      - Fetch window and tab data.
      - Modify tabs (move, suspend, close, etc.).
      - Modify windows (create, focus, close, etc.).
      - Implement session saving and restoring logic.
    - Handles events from both the Manager Tab UI and the Popup UI, as well as browser events (e.g., tab created, tab closed).
    - Orchestrates communication between different parts of the extension.

4.  **Content Script (content.ts - Optional):**
    - Currently considered optional. May be used in the future if features require interaction with the content of web pages.
    - If implemented, it would allow the extension to access and manipulate the DOM of web pages, potentially for features like tab grouping based on page content or advanced tab information extraction.

### Key Design Patterns

- **Component-Based Architecture:** The UI is built using reusable React components, promoting modularity and maintainability.
- **Event-Driven Architecture:** Communication between components, especially between the UIs and background script, is primarily event-driven. This allows for loose coupling and reactive updates.
- **State Management (within React UIs):** React's built-in state management or potentially a library like Zustand or Recoil (if needed for more complex state) will be used to manage UI state and data flow within both the Manager Tab UI and Popup UI.
- **Service Worker Pattern (Background Script):** The background script acts as a service worker, running in the background and handling long-running tasks and event processing.

### Data Flow

_(Data flow description remains largely the same, but now refers to "Manager Tab UI" instead of "Popup UI" for actions related to window and tab management)_

1.  **Initial Load (Manager Tab):** When the Manager Tab UI is opened, it requests window and tab data from the Background Script.
2.  **Data Fetching:** The Background Script uses Chrome Extension APIs to retrieve the current state of windows and tabs.
3.  **Data Rendering:** The Background Script sends the data back to the Manager Tab UI, which renders it using React components.
4.  **User Actions (Manager Tab):** User interactions in the Manager Tab UI (e.g., clicking a button, dragging a tab) trigger events.
5.  **Command Handling:** These events are sent to the Background Script, which processes the commands using Chrome Extension APIs to modify tabs or windows.
6.  **State Updates:** Changes made by the Background Script are reflected in the browser state, and the Background Script may push updates back to the Manager Tab UI to refresh the displayed data.

### Considerations

- **Performance:** Efficient data handling and rendering are crucial for a smooth user experience, especially with a large number of tabs and windows in the Manager Tab UI.
- **Scalability:** The architecture should be scalable to accommodate potential future features and increased complexity, particularly within the Manager Tab UI.
- **Maintainability:** Modularity and clear separation of concerns are essential for long-term maintainability and ease of development, especially as the Manager Tab UI becomes more feature-rich.
