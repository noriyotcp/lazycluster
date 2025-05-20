# Development Guidelines

## Role

- Document the development guidelines for the project.
- Provide best practices and conventions for the codebase.
- Ensure code quality and maintainability.

1.  **Unified Type Definition Management:**  
    Consolidate all type definitions in one location (e.g., src/@types) and consistently import them using aliases throughout the project.  
    → Prevents build errors caused by duplicate or inconsistent type definitions.

2.  **Consistent Use of Import Paths:**  
    Always use aliases as configured in tsconfig.json instead of relative paths to improve maintainability and readability.

3.  **Immediate Deletion of Unnecessary Files:**  
    Promptly organize and delete unnecessary files and code to keep the file structure clean.  
    → Eliminates redundancy, confusion, and potential build errors.

4.  **Continuous Documentation Updates:**  
    Keep internal documents (e.g., ADRs, progress notes) updated with lessons learned and best practices gleaned from development experience.

5.  **Regular Code Reviews and Revisions:**
    Periodically review and update these guidelines to ensure they stay relevant as the project evolves.

## React Components

### Avoid Using `React.FC`

When defining React functional components, avoid using `React.FC`. Instead, explicitly type the props and return type.

**Why?**

- `React.FC` implicitly includes `children`, which may not always be desired.
- It can interfere with `defaultProps` and other static properties.
- It's less explicit and can be less readable than typing props directly.

**Instead:**

```typescript
interface MyComponentProps {
  name: string;
}

const MyComponent = ({ name }: MyComponentProps): JSX.Element => {
  return <div>Hello, {name}!</div>;
};
```

**Reference:**

- [TypeScript + React: Why I don't use React.FC](https://fettblog.eu/typescript-react-why-i-dont-use-react-fc/)

**Note:** In this project, define functional components without using React.FC to ensure explicit prop definitions and to avoid unintended inclusion of the children prop.

## Toast and Alert Components Update

- The ToastProvider and Toast components have been restructured to improve compatibility with daisyUI's toast stacking behavior.
- ToastContainer now wraps toasts in a container div with appropriate daisyUI classes to ensure proper stacking.
- The Toast component returns only the content without an extra wrapper div, allowing the container to manage stacking.
- An Alert component was extracted to provide a reusable alert UI, which is used within ToastProvider to display error messages and notifications.
- The ToastProvider injects an `onClose` prop into Alert components to allow for controlled dismissal of toasts.
- TabItem component now uses the Alert component for displaying toast messages on tab close failures.

## Tailwind CSS Safelist Enhancement

- Added a safelist of Tailwind CSS color classes in `tailwind.config.js` to prevent tree-shaking from removing dynamically applied color styles.
- Alert-specific classes (`alert-error`, `alert-success`, `alert-warning`, `alert-info`) are included in the safelist to ensure consistent styling.
- This change prevents visual breakage caused by missing CSS for dynamically generated class names.

## Recommendations for Documentation Updates

- Update README.md or relevant user-facing documentation to describe the new Alert component and its usage within toasts.
- Document the need for safelisting dynamic Tailwind CSS classes to avoid styling issues.
- Include examples of how to use the ToastProvider and Alert components together for consistent UI feedback.
- Note the improved toast stacking behavior and how it affects UI layout.

These guidelines help maintain UI consistency and prevent common styling pitfalls related to dynamic class usage in Tailwind CSS.

### Lessons Learned (Project-wide)

- Clearly define requirements for expected behaviors.
- Always consult official documentation and leverage built-in framework features.
- Separate component responsibilities to improve code organization and reusability.
- Emphasize iterative improvement and continuous information gathering based on feedback, leveraging the distinction between PLAN MODE and ACT MODE for iterative refinement.
- Prioritize clear and accurate naming conventions, and refine names as code evolves.
- Avoid prop drilling by using the Context API, but be mindful of the impact of context changes on dependent components.
- During refactoring, promptly remove all unused code (props, state, functions, imports) to maintain code clarity.
- Document lessons learned to inform future development and provide reference for similar challenges.
