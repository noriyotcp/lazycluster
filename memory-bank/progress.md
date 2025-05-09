# Project Progress and Status

_(Keep track of project progress, milestones, and current status. Note what's working, what's left to build, and any known issues.)_

## Overall Progress

- Basic extension setup and popup UI: **Done**
- Manager page implementation: **In Progress**
- Background service worker logic: **In Progress**
- Settings page: **To Do**
- E2E testing: **In Progress**
- Documentation: **In Progress**

## What's Working

- Tab listing and grouping by window.
- Basic UI layout and styling.
- Theme switching functionality.
- **Bulk tab selection and closing (now targets only visible/filtered tabs).**
- Keyboard navigation in TabList.
- URL search functionality.
- Tab hover domain display.
- Responsive 2-column layout using Tailwind CSS Grid.
- Focus search bar on '/' key press in manager tab.
- Client-side automatic reconnection to the background script, improving connection stability.

## What's Left to Build

- Implement settings page for user customization.
- Explore possibilities for cross-device window synchronization.
- Add more advanced tab management features.
- Implement comprehensive E2E tests.
- Finalize documentation and project cleanup.

## Current Status

- **Bulk selection feature enhancement (targeting visible tabs) and related refactoring are complete.**
- Documentation updates are currently in progress.
- Code refactoring and UI improvements are ongoing.
- Core features are functional and being tested.
- Development environment is set up and ready for implementation.
- Key features are identified and prioritized based on user needs and project goals.
- No major blockers identified yet.

## Recent Milestones

- Implemented a responsive 2-column layout for window groups using Tailwind CSS grid.
- Adjusted layout breakpoints to `lg` for better responsiveness.
- Added URL search functionality to the search bar.
- Implemented tab hover domain display.
- Refactored provider components to use `React.ReactElement` type for better type safety.
- Removed redundant `updateTabGroups()` call in `TabItem` to avoid double updating.
- Implemented keyboard navigation for TabList component using native `onKeyDown` event handler.
- Added event listeners for tab movement tracking.
- Implemented focusing the search bar when the '/' key is pressed in the manager tab.
- Refactored background script connection logic in `entrypoints/background.ts` by extracting it into a `connect` function.
- Implemented client-side reconnection logic using the `useBackgroundConnection` custom hook in `src/hooks/useBackgroundConnection.ts`.
- Refactored `entrypoints/manager/App.tsx` to use `useBackgroundConnection` for improved connection management.
- **Enhanced bulk selection to operate only on currently visible (filtered) tabs.**
- **Refactored `TabSelectionContext` to use a list of tab IDs for selection/deselection.**
- **Removed unused props, state, and functions related to the old bulk selection logic from `WindowActions`, `WindowGroup`, `TabList`, and `TabSelectionContext`.**

## Known Issues

- Minor UI alignment issues in certain scenarios.
- Potential performance bottlenecks with large numbers of tabs (Need further review and testing).
- Need to implement more robust error handling and user feedback mechanisms.

## Lessons Learned

- Added event listeners for tab movement enabled the UI to reflect tab reordering.
- Recognized the importance of explicitly defining requirements for expected behaviors.
- A review of the original "cluster" implementation could have prevented oversights.
- Established the need to integrate unit and E2E testing to catch such issues early.
- Leverage UI Framework Features: We initially overlooked the built-in Theme Controller component provided by daisyUI and attempted a manual implementation. Utilizing framework-provided features can significantly simplify development and improve efficiency.
- Component Responsibility Separation: Creating dedicated single-purpose components improves code organization and reusability. By isolating the theme-switching functionality into its own component other components can focus on their primary responsibilities leading to better maintainability and clearer component design.
- Importance of Iterative Improvement and Information Gathering: Initial approaches may not always be optimal. User feedback and continuous information gathering are crucial for identifying better solutions and iteratively improving implementations.
- Value of PLAN MODE: Thorough planning in PLAN MODE is critical. A more in-depth plan can identify potential pitfalls early and reduce rework during ACT MODE.
- Handling replace_in_file failures: When `replace_in_file` fails multiple times it is more efficient to use `write_to_file` as a fallback.
- Naming Conventions: The importance of choosing clear and accurate names for props and states especially when dealing with complex logic and component hierarchies. Inconsistent or misleading names can lead to confusion and rework.
- Iterative Naming Refinement: Naming is not always straightforward and may require iterative refinement as the code evolves and logic becomes clearer. Be prepared to revisit and adjust names as needed.
- Prop Drilling and Context API: Prop drilling can complicate component relationships and make naming more challenging. Context API can be a valuable tool to simplify prop flow and improve code organization in such cases.
- Client vs. Background Connection Responsibility: Understanding the distinct roles of client-side scripts (initiating connections, handling reconnects) and background scripts (listening for connections) is crucial for designing robust communication patterns in Chrome extensions. Background scripts typically don't initiate reconnections themselves.
- Importance of Client-Side Connection Management: Implementing connection management (including automatic reconnection) on the client-side (e.g., using a custom hook like `useBackgroundConnection`) is essential for maintaining a stable connection to the background script, especially when the background script might be suspended and restarted by the browser.
- **Clarity in Refactoring: When refactoring, clearly identify and remove all unused code (props, state, functions, imports) to maintain a clean and understandable codebase. This improves maintainability and reduces potential confusion for future development.**
- **Impact of Context Changes: Modifying a shared context (like `TabSelectionContext`) can have cascading effects. It's important to trace all usages of the context to ensure all dependent components are updated correctly or that unused parts are thoroughly removed.**

## Next Actions

- Keep scroll position when refreshing the page using localStorage
  - Reconsider `localStorage` key naming
- Continue updating documentation files.
- Address known issues and potential performance bottlenecks.
- Implement E2E tests for UI components.
- Explore settings page implementation.
