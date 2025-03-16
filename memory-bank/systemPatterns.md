# System Patterns: LazyCluster

## System Architecture

LazyCluster will adopt a modular architecture consisting of the following main components:

- **Popup UI (React):**  The extension will feature a popup UI, displayed when the extension icon is clicked. This popup will contain a "Window Manager" button.  Upon clicking this button, the extension will open a new browser tab, pin it, and load the `manager.html` page within it. This `manager.html` page, acting as the main application window, will then display a comprehensive list of all currently open tabs and windows, providing the primary interface for tab and window management. The URL for this manager tab will follow the format `chrome-extension://<extension-id>/manager.html`. This design, where the main UI resides in a pinned tab launched from the popup, is directly inspired by the user experience of the original "cluster" extension. The popup itself will primarily serve as a launcher for the main "Window Manager" tab, and may contain quick actions or status indicators in the future.
- **Background Service Worker (TypeScript):**  The core logic of the extension, responsible for interacting with Chrome APIs, managing data, and handling events. Implemented in TypeScript for robustness and maintainability.
- **Content Scripts (Optional, TypeScript):**  Potentially used for advanced features like tab summarization or similar tab detection, if needed.  Content scripts would communicate with the background service worker.

Communication between components will primarily use Chrome Runtime Messaging API. State management within the popup UI will be handled using React's built-in state management or a lightweight state management library if necessary. Data persistence will be managed using Chrome Storage API, initially focusing on `storage.local`.

## Key Technical Decisions

- **Framework: WXT:**  Utilize WXT framework to streamline development, leveraging Vite for build process, HMR, and extension-specific features.
- **UI Framework: React:**  Employ React for building the popup UI due to its component-based architecture, virtual DOM, and ecosystem support.
- **Language: TypeScript:**  Adopt TypeScript for both UI and background logic to enhance code quality, maintainability, and developer experience.
- **Build Tool: Vite:**  Leverage Vite for its speed, efficient development workflow, and optimized production builds.
- **Chrome Extension APIs:**  Utilize Chrome Tabs, Windows, Storage, Commands, and Runtime APIs for core extension functionality.

## Design Patterns

- **Component-Based Architecture (React):**  Break down the UI into reusable and modular React components for maintainability and scalability.
- **Event-Driven Architecture (Service Worker):**  Utilize Chrome Extension event APIs (e.g., tabs.onCreated, windows.onFocusChanged) to trigger actions and manage state changes in the background service worker.
- **Message Passing (Chrome Runtime Messaging):**  Employ Chrome Runtime Messaging API for communication between popup UI and background service worker, and potentially content scripts.
- **State Management (React Context/useState/useReducer):**  Utilize React's state management features to manage UI state within the popup component efficiently.

## Component Relationships

- **Popup UI <-> Background Service Worker:**  Popup UI will send messages to the background service worker to perform actions such as:
    - Fetching tab and window data.
    - Suspending/discarding tabs.
    - Closing tabs and windows.
    - Saving and restoring sessions.
    - Applying user settings.
  The background service worker will respond with data updates and action confirmations.

- **Background Service Worker <-> Chrome APIs:** The background service worker will directly interact with Chrome Extension APIs to:
    - Query and manipulate tabs and windows (chrome.tabs, chrome.windows).
    - Store and retrieve extension data (chrome.storage).
    - Register commands (chrome.commands).
    - Manage extension lifecycle and communication (chrome.runtime).

- **Content Scripts <-> Background Service Worker (Optional):** If content scripts are implemented, they will communicate with the background service worker to:
    - Send page content for analysis (e.g., for tab summarization).
    - Receive instructions from the background service worker.
