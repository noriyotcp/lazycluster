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
