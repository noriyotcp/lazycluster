# Project Progress: LazyCluster

## What Works

- **Project Setup:**

  - Project is initialized with WXT (Web Extension Toolkit).
  - Basic project structure is in place, including `entrypoints` for different extension contexts (popup, manager, background, content).
  - TypeScript, React, and Vite are configured and working correctly.
  - Development environment is set up with Hot Module Replacement for efficient development.
  - ESLint and Prettier are configured for linting and formatting.

- **Memory Bank:**
  - Core memory bank files are initialized: `projectbrief.md`, `productContext.md`, `activeContext.md`, `systemPatterns.md`, `techContext.md`, `progress.md`.
  - `projectbrief.md`, `productContext.md`, `systemPatterns.md`, and `techContext.md` are drafted and updated.
  - `activeContext.md` is being used to track current focus, recent changes, and next steps.

## What's Left to Build

- **Core Features:**

  - **Window and Tab Overview (Manager Tab UI):**
    - Implement UI to display all open windows and tabs.
    - Implement drag and drop tab reordering within and between windows.
    - Implement tab searching and filtering.
    - Implement tab sorting within windows (including by domain).
    - Implement bulk tab selection and actions (close, move, suspend).
    - Implement management of tabs within each domain.
  - **Tab Management Features:**
    - Tab suspension to reduce memory usage.
    - Tab discarding/closing with undo functionality.
    - Ability to move tabs to new or existing windows.
  - **Window Management Features:**
    - Window creation and focusing.
    - Window closing.
    - Window naming (optional).
  - **Session Management Features:**
    - Saving and restoring browser sessions (windows and tabs).
    - Opening saved sessions with tabs in a suspended state.
    - Importing and exporting sessions in CSV/JSON format.
    - Cloud backup and sync for saved sessions (future consideration).

- **User Interface & Experience:**

  - Develop the Manager Tab UI using React components.
  - Develop the Popup UI (currently just for opening Manager Tab).
  - Implement dark and light theme options.
  - Implement customizable keyboard shortcuts to open the extension.
  - Ensure clear visual feedback for actions.

- **Testing:**

  - Implement unit tests for core business logic.
  - Implement integration tests for API endpoints and extension-specific functionalities.
  - Implement end-to-end tests for critical user flows.

- **Documentation:**
  - Update relevant documentation in `/docs` when modifying features.
  - Keep `README.md` in sync with new capabilities.
  - Create ADRs in `/docs/adr` for significant architectural decisions.

## Current Status

- **Planning Phase:** Initial project planning and documentation are in progress. Core memory bank files are being drafted and refined.
- **Development Environment:** Development environment is set up and ready for implementation.
- **Feature Prioritization:** Key features are identified and prioritized based on user needs and project goals.
- **No major blockers identified yet.**

## Known Issues

- **No testing framework is currently implemented.** This needs to be addressed as development progresses.
- **UI development has not started yet.** Focus has been on project setup and documentation.

## Next Actions

1. **Finalize `progress.md` based on feedback.**
2. **Start outlining UI structure and components for the Manager Tab UI.**
3. **Begin implementing the basic UI structure in React.**
4. **Set up a basic testing environment (e.g., Jest) and write initial unit tests.**
5. **Continue to update memory bank files as development progresses.**
