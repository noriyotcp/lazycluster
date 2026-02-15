/**
 * Pure utility functions for Window Group collapse/expand operations
 */

/**
 * Toggle all window group collapse checkboxes to the specified state.
 *
 * @param targetChecked - The desired checked state for all checkboxes
 * @param doc - Document to query (injectable for testing)
 */
export function toggleAllWindowGroupCollapses(
  targetChecked: boolean,
  doc: Document = document
): void {
  const checkboxes = doc.querySelectorAll<HTMLInputElement>(
    'input[id^="window-group-collapse-"]'
  );
  checkboxes.forEach((checkbox) => {
    checkbox.checked = targetChecked;
  });
}
