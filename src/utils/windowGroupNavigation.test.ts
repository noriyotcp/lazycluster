import { describe, it, expect } from 'vitest';
import {
  canAddDigitToBuffer,
  shouldBlockKeyboardShortcut,
  parseNavigationKey,
} from './windowGroupNavigation';

describe('windowGroupNavigation utilities', () => {
  describe('canAddDigitToBuffer', () => {
    it('allows first digit "0"', () => {
      expect(canAddDigitToBuffer('', '0')).toBe(true);
    });

    it('allows first digit "1-9"', () => {
      expect(canAddDigitToBuffer('', '1')).toBe(true);
      expect(canAddDigitToBuffer('', '9')).toBe(true);
    });

    it('rejects digit after "0"', () => {
      expect(canAddDigitToBuffer('0', '1')).toBe(false);
      expect(canAddDigitToBuffer('0', '0')).toBe(false);
      expect(canAddDigitToBuffer('0', '9')).toBe(false);
    });

    it('allows multiple digits for non-zero buffers', () => {
      expect(canAddDigitToBuffer('1', '2')).toBe(true);
      expect(canAddDigitToBuffer('12', '3')).toBe(true);
      expect(canAddDigitToBuffer('999', '9')).toBe(true);
    });
  });

  describe('shouldBlockKeyboardShortcut', () => {
    it('returns false when no element is focused', () => {
      expect(shouldBlockKeyboardShortcut(null)).toBe(false);
    });

    it('allows shortcuts for checkboxes', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      expect(shouldBlockKeyboardShortcut(checkbox)).toBe(false);
    });

    it('blocks shortcuts for text input', () => {
      const input = document.createElement('input');
      input.type = 'text';
      expect(shouldBlockKeyboardShortcut(input)).toBe(true);
    });

    it('blocks shortcuts for textarea', () => {
      const textarea = document.createElement('textarea');
      expect(shouldBlockKeyboardShortcut(textarea)).toBe(true);
    });

    it('blocks shortcuts for select', () => {
      const select = document.createElement('select');
      expect(shouldBlockKeyboardShortcut(select)).toBe(true);
    });

    it('blocks shortcuts for contenteditable', () => {
      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      expect(shouldBlockKeyboardShortcut(div)).toBe(true);
    });

    it('allows shortcuts for non-input elements', () => {
      const div = document.createElement('div');
      expect(shouldBlockKeyboardShortcut(div)).toBe(false);
    });
  });

  describe('parseNavigationKey', () => {
    it('parses "w" as START_SEQUENCE', () => {
      const event = new KeyboardEvent('keydown', { key: 'w' });
      expect(parseNavigationKey(event)).toEqual({ type: 'START_SEQUENCE' });
    });

    it('parses "Escape" as CANCEL', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      expect(parseNavigationKey(event)).toEqual({ type: 'CANCEL' });
    });

    it('parses "Enter" as CONFIRM', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      expect(parseNavigationKey(event)).toEqual({ type: 'CONFIRM' });
    });

    it('parses "Backspace" as DELETE', () => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      expect(parseNavigationKey(event)).toEqual({ type: 'DELETE' });
    });

    it('parses digits as DIGIT with value', () => {
      const event0 = new KeyboardEvent('keydown', { key: '0' });
      expect(parseNavigationKey(event0)).toEqual({ type: 'DIGIT', value: '0' });

      const event9 = new KeyboardEvent('keydown', { key: '9' });
      expect(parseNavigationKey(event9)).toEqual({ type: 'DIGIT', value: '9' });
    });

    it('parses "/" as SEARCH_FOCUS', () => {
      const event = new KeyboardEvent('keydown', { key: '/' });
      expect(parseNavigationKey(event)).toEqual({ type: 'SEARCH_FOCUS' });
    });

    it('parses "?" as HELP', () => {
      const event = new KeyboardEvent('keydown', { key: '?' });
      expect(parseNavigationKey(event)).toEqual({ type: 'HELP' });
    });

    it('returns null for unrecognized keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      expect(parseNavigationKey(event)).toBeNull();
    });

    it('returns null for modifier keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'Shift' });
      expect(parseNavigationKey(event)).toBeNull();
    });
  });
});
