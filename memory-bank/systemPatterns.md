# System Patterns: LazyCluster

## Role

- Describe the system architecture.
- Explain key technical decisions.
- Document design patterns in use.
- Outline component relationships.

## localStorage Key Naming Convention

- Key names follow the order: `appName.pageName.feature`.
- Use dot (`.`) as the main separator for hierarchy levels.
- Use hyphen (`-`) within compound words for clarity.
- Example: `lazycluster.manager.color-scheme`, `lazycluster.manager.theme`.
- This convention improves readability, maintainability, and scalability of stored keys.

## System Architecture

LazyCluster follows a modular, component-based architecture, primarily leveraging React components for the UI and background scripts for core logic and browser API interactions. The architecture is designed to be event-driven and reactive, ensuring efficient updates and interactions between different parts of the extension.

### Component Descriptions

1.  **Manager Tab UI (React):**

    - Built using React and TypeScript, specifically `entrypoints/manager/App.tsx`.
    - Responsible for rendering the main user interface within a dedicated browser tab (the "manager tab").
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
    - Listens for connections from the Manager Tab UI (`chrome.runtime.onConnect`).
    - Orchestrates communication between different parts of the extension.

4.  **Content Script (content.ts - Optional):**
    - Currently considered optional. May be used in the future if features require interaction with the content of web pages.
    - If implemented, it would allow the extension to access and manipulate the DOM of web pages, potentially for features like tab grouping based on page content or advanced tab information extraction.

### Key Design Patterns

- **Component-Based Architecture:** The UI is built using reusable React components, promoting modularity and maintainability.
- **Base CSS Styles:** Application-wide styles are defined to ensure a consistent look and feel across the extension, loaded before entrypoint-specific styles.
- **Event-Driven Architecture:** Communication between components, especially between the UIs and background script, is primarily event-driven. This allows for loose coupling and reactive updates.
- **State Management (within React UIs):** React's built-in state management or potentially a library like Zustand or Recoil (if needed for more complex state) will be used to manage UI state and data flow within both the Manager Tab UI and Popup UI.
- **Service Worker Pattern (Background Script):** The background script acts as a service worker, running in the background and handling long-running tasks and event processing.
- **Persistent Connection with Reconnect (Manager UI):** The Manager Tab UI uses a custom React hook (`useBackgroundConnection`) to establish and maintain a persistent connection (`chrome.runtime.Port`) to the background script. This hook automatically handles reconnection attempts if the connection is lost (e.g., due to the background script being suspended and restarted).

### Component Relationships

- **Manager UI <-> Background Script:** Communication happens via a persistent `chrome.runtime.Port` established by the Manager UI. The `useBackgroundConnection` hook manages this connection and its lifecycle, including reconnection. Messages are exchanged for requesting data, sending commands, and receiving updates.
- **Popup UI <-> Background Script:** Communication likely uses short-lived messages (`chrome.runtime.sendMessage`) or potentially a short-lived port connection, primarily to trigger the opening of the Manager Tab.
- **State Synchronization between WindowActions and TabItem:** To ensure UI consistency, the TabItem component subscribes to the TabSelectionContext and updates its `isChecked` state based on the `selectedTabIds`. This allows the TabItem's checkbox to reflect the selection state when tabs are selected/deselected via the WindowActions component.

### Data Flow

1.  **Connection Establishment (Manager Tab):** The Manager Tab UI, using `useBackgroundConnection`, establishes a persistent connection (`chrome.runtime.Port`) to the Background Script.
2.  **Initial Data Request (Manager Tab):** Once the connection is established, the Manager Tab UI sends a message (`REQUEST_INITIAL_DATA`) to the Background Script via the port.
3.  **Data Fetching (Background):** The Background Script receives the request, uses Chrome Extension APIs to retrieve the current state of windows and tabs.
4.  **Data Transmission (Background -> Manager):** The Background Script sends the tab/window data back to the Manager Tab UI via the established port (`UPDATE_TABS` message).
5.  **Data Rendering (Manager Tab):** The Manager Tab UI receives the data and renders it using React components.
6.  **User Actions (Manager Tab):** User interactions trigger commands sent to the Background Script via the port using the `sendMessage` function from `useBackgroundConnection`.
7.  **Command Handling (Background):** The Background Script receives commands, processes them using Chrome Extension APIs.
8.  **Browser Event Triggered Updates (Background):** Browser events (like tab creation/removal) trigger the Background Script to fetch updated tab data.
9.  **Push Updates (Background -> Manager):** The Background Script sends updated tab data (`UPDATE_TABS`) to the connected Manager Tab UI via the port.
10. **Reconnection:** If the connection drops, `useBackgroundConnection` in the Manager Tab UI automatically attempts to re-establish the connection and repeats the initial data request upon success.

### Considerations

- **Performance:** Efficient data handling and rendering are crucial for a smooth user experience, especially with a large number of tabs and windows in the Manager Tab UI.
- **Scalability:** The architecture should be scalable to accommodate potential future features and increased complexity, particularly within the Manager Tab UI.
- **Maintainability:** Modularity and clear separation of concerns are essential for long-term maintainability and ease of development, especially as the Manager Tab UI becomes more feature-rich.
