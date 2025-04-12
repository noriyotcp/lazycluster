# Lessons Learned

## Implementation Challenges and Solutions

- **SEARCH/REPLACE Operations:**  
  Auto-formatting by the editor caused challenges with matching code exactly. This required careful handling of escape characters and precise SEARCH blocks.
- **Comment Strategy:**  
  Instead of overusing verbose "Why" comments, "Why not" comments were used sparingly to explain deviations from conventional practices only in areas where readers might naturally have questions.
- **Keyboard Event Handling:**  
  An initial approach using key presses from the body did not reliably focus the search bar. Switching to `page.keyboard.press('/')` provided a more direct and consistent method to trigger focus.

## Iterative Design and Feedback

- **Process:**  
  The development process leveraged the separation between PLAN MODE and ACT MODE, enabling iterative improvements based on user feedback.
- **Incremental Refinement:**  
  Step-by-step adjustments, including enhanced keyboard event handling and updated E2E tests, led to a more robust and reliable feature implementation.
- **Documentation:**  
  Recording these lessons helps inform future development and provides a valuable reference on handling similar challenges in upcoming projects.
