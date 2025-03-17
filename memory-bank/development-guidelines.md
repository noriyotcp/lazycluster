# Development Guidelines

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
