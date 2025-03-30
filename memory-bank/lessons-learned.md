# Lessons Learned

This document captures project-specific lessons and insights gained during development.

## General

1.  SEARCH blocks in replace_in_file must exactly match the file content, including whitespace and line endings.
2.  In PLAN MODE, remember to use plan_mode_response tool for responses.
3.  Error messages (especially eslint and ts errors) are important hints for problem solving (Importance of error messages).
4.  When executing commands using the `execute_command` tool, ensure the command line is correctly outputting `&&` instead of `&amp;&amp;`.
5.  Be careful when using file operations: Repeatedly using `replace_in_file` may break code.
6.  Error messages are treasure trove: Error messages are powerful hints for problem solving.
7.  write_to_file is the last resort: `write_to_file` is effective as a last resort if `replace_in_file` is NG.
8.  Naming is hard: Naming is a challenging task, especially when the logic evolves. It's important to choose names that accurately reflect the current logic and are consistent across the codebase.
9.  Component Hierarchy and Prop Drilling complicate naming: Deep component hierarchies and prop drilling can make naming more difficult. Consider using Context API or other state management solutions to simplify prop flow and improve naming clarity.
10. **Event Listener Awareness:** When using event listeners (e.g., `chrome.tabs.onRemoved`), ensure that you understand the event flow and avoid redundant updates.
11. UI misalignment can be caused by unexpected CSS scope.
12. Leaving TODO comments can help clarify areas that need further modification.
13. The SEARCH block in `replace_in_file` must exactly match the file content.
14. `chrome.tabs.get` API can be used to get tab information from tab ID.
