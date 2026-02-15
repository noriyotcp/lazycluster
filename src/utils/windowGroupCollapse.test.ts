import { describe, it, expect, beforeEach } from 'vitest';
import { toggleAllWindowGroupCollapses } from './windowGroupCollapse';

describe('windowGroupCollapse utilities', () => {
  let mockDoc: Document;

  beforeEach(() => {
    mockDoc = document.implementation.createHTMLDocument('Test');
  });

  function createCollapseCheckbox(id: number, checked: boolean): void {
    const checkbox = mockDoc.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `window-group-collapse-${id}`;
    checkbox.checked = checked;
    mockDoc.body.appendChild(checkbox);
  }

  describe('toggleAllWindowGroupCollapses', () => {
    it('collapses all window groups', () => {
      createCollapseCheckbox(1, true);
      createCollapseCheckbox(2, true);
      createCollapseCheckbox(3, true);

      toggleAllWindowGroupCollapses(false, mockDoc);

      const checkboxes = mockDoc.querySelectorAll<HTMLInputElement>(
        'input[id^="window-group-collapse-"]'
      );
      checkboxes.forEach((cb) => {
        expect(cb.checked).toBe(false);
      });
    });

    it('expands all window groups', () => {
      createCollapseCheckbox(1, false);
      createCollapseCheckbox(2, false);
      createCollapseCheckbox(3, false);

      toggleAllWindowGroupCollapses(true, mockDoc);

      const checkboxes = mockDoc.querySelectorAll<HTMLInputElement>(
        'input[id^="window-group-collapse-"]'
      );
      checkboxes.forEach((cb) => {
        expect(cb.checked).toBe(true);
      });
    });

    it('handles mixed states correctly', () => {
      createCollapseCheckbox(100, true);
      createCollapseCheckbox(200, false);

      toggleAllWindowGroupCollapses(false, mockDoc);

      const cb1 = mockDoc.getElementById(
        'window-group-collapse-100'
      ) as HTMLInputElement;
      const cb2 = mockDoc.getElementById(
        'window-group-collapse-200'
      ) as HTMLInputElement;
      expect(cb1.checked).toBe(false);
      expect(cb2.checked).toBe(false);
    });

    it('does nothing when no window groups exist', () => {
      expect(() =>
        toggleAllWindowGroupCollapses(true, mockDoc)
      ).not.toThrow();
    });

    it('ignores non-window-group checkboxes', () => {
      const tabCheckbox = mockDoc.createElement('input');
      tabCheckbox.type = 'checkbox';
      tabCheckbox.id = 'tab-123';
      tabCheckbox.checked = true;
      mockDoc.body.appendChild(tabCheckbox);

      createCollapseCheckbox(1, true);

      toggleAllWindowGroupCollapses(false, mockDoc);

      expect(tabCheckbox.checked).toBe(true);
      expect(
        (mockDoc.getElementById('window-group-collapse-1') as HTMLInputElement)
          .checked
      ).toBe(false);
    });
  });
});
