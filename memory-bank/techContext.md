# Tech Context: LazyCluster

## Technologies Used

- **Framework:** WXT (Web Extension Toolkit) - A modern framework for building web extensions, providing Vite integration, HMR, and simplified extension development workflows.
- **UI Library:** React - A JavaScript library for building user interfaces, chosen for its component-based architecture and efficient rendering.
- **Language:** TypeScript - A superset of JavaScript that adds static typing, improving code quality and maintainability.
- **Build Tool:** Vite - A fast and efficient build tool that provides rapid development and optimized production builds.
- **Chrome Extension APIs:** Standard Chrome Extension APIs for accessing browser functionality (tabs, windows, storage, etc.).
- **Styling:** Tailwind CSS (Conceptual) - While not explicitly listed, Tailwind CSS or a similar utility-first CSS framework is considered for styling the UI components, as suggested in the design documents, to ensure a modern and responsive design. Shadcn UI (Conceptual) - Component library based on Radix UI and Tailwind CSS, also considered for UI components to accelerate development and maintain design consistency.

## Development Setup

- **IDE:** VSCode (Recommended) - A popular code editor with excellent TypeScript and JavaScript support, and extension ecosystem.
- **Package Manager:** npm (or yarn/pnpm) - Node.js package managers for managing project dependencies.
- **Node.js:** Required for running Vite and npm scripts.
- **Chrome Browser:** For testing and debugging the browser extension during development.
- **WXT CLI:** Command-line interface provided by WXT for project setup, development, and building.

## Technical Constraints

- **Chrome Extension API Limitations:** Browser extensions have limitations in terms of API access and background script persistence, which need to be considered during development. Manifest V3 introduces further restrictions, especially regarding background service workers and webRequest API.
- **Manifest V3 Requirements:** LazyCluster will be developed to comply with Chrome's Manifest V3, ensuring future compatibility and security.
- **Performance Considerations:** Efficiently managing browser resources and minimizing performance impact is crucial for a browser extension, especially when handling a large number of tabs and windows.
- **Chrome Web Store Policies:** Adherence to Chrome Web Store policies, including the "single purpose" policy and user data privacy guidelines, is essential for successful deployment and distribution.

## Dependencies

- **package.json:** Defines project dependencies, including React, TypeScript, WXT, and other necessary libraries. Managed by npm.
- **tsconfig.json:** TypeScript configuration file, defining compiler options and project settings.
- **wxt.config.ts:** WXT framework configuration file, used to customize the build process and define extension-specific settings.
- **.gitignore:** Specifies intentionally untracked files that Git should ignore.
