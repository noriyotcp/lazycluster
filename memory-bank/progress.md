# Project Progress: LazyCluster

## Role

- Track what works.
- Track what's left to build.
- Document the current status.
- Note any known issues.

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
- **UI Layout:**
  - Implemented a responsive 2-column layout for window groups using `column-count` CSS property.
  - Refactored `src/components/WindowGroupList.tsx` to use `columns-2` for multi-column layout.
  - Removed Flexbox implementation from `src/components/WindowGroupList.tsx`.
  - Removed `max-height` from `collapse-content` in `src/components/WindowGroup.tsx`.
  - Implemented title truncation for long site titles.
  - Implemented tab focusing via Chrome Extension API.

## What's Left to Build

- **Core Features:**

  - Implement UI to display all open windows and tabs.
  - Implement drag and drop tab reordering within and between windows.
  - Implement tab searching and filtering.
  - Implement tab sorting within windows (including by domain).
  - Implement bulk tab selection and actions (close, move, suspend).
  - Implement management of tabs within each domain.
  - Tab suspension to reduce memory usage.
  - Tab discarding/closing with undo functionality.
  - Ability to move tabs to new or existing windows.
  - Window creation and focusing.
  - Window closing.
  - Window naming (optional).
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

- **Initial Planning:**
  - Planning Phase: Initial project planning and documentation are in progress. Core memory bank files are being drafted and refined.
  - Development Environment: Development environment is set up and ready for implementation.
  - Feature Prioritization: Key features are identified and prioritized based on user needs and project goals.
  - No major blockers identified yet.
- **UI Layout Implementation:**
  - Implemented a responsive 2-column layout for window groups using the `column-count` CSS property.
  - Refactored `src/components/WindowGroupList.tsx` to use `columns-2` for multi-column layout.
  - Removed Flexbox implementation from `src/components/WindowGroupList.tsx`.
  - Removed `max-height` from `collapse-content` in `src/components/WindowGroup.tsx`.
  - Implemented title truncation for long site titles.
  - Implemented tab focusing via Chrome Extension API.

## Known Issues

- No testing framework is currently implemented. This needs to be addressed as development progresses.
- UI development has not started yet. Focus has been on project setup and documentation.

## Lessons Learned

- **UI Layout Implementation:**
  - We learned that `column-count` is a simple and effective way to create multi-column layouts, and that it can be a better choice than Flexbox or Grid for certain use cases.

## Next Actions

- Implement the search field clear button.
- Investigate and fix the favicon issue in the manager tab.
- Update the manifest.json description to 'lazycluster'.
- Configure dev mode data persistence.
- Finalize `progress.md` based on feedback.
- Start outlining UI structure and components for the Manager Tab UI.
- Begin implementing the basic UI structure in React.
- Set up a basic testing environment (e.g., Jest) and write initial unit tests.
- Continue to update memory bank files as development progresses.
