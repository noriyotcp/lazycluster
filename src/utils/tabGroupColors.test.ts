import { describe, it, expect } from 'vitest';
import { getTabGroupBorderColorClass } from './tabGroupColors';
import type { TabGroupColor } from '../types/tabGroup';

describe('getTabGroupBorderColorClass', () => {
  it('should return correct Tailwind border-left class for grey', () => {
    expect(getTabGroupBorderColorClass('grey')).toBe('border-l-gray-500');
  });

  it('should return correct Tailwind border-left class for blue', () => {
    expect(getTabGroupBorderColorClass('blue')).toBe('border-l-blue-500');
  });

  it('should return correct Tailwind border-left class for red', () => {
    expect(getTabGroupBorderColorClass('red')).toBe('border-l-red-500');
  });

  it('should return correct Tailwind border-left class for yellow', () => {
    expect(getTabGroupBorderColorClass('yellow')).toBe('border-l-yellow-500');
  });

  it('should return correct Tailwind border-left class for green', () => {
    expect(getTabGroupBorderColorClass('green')).toBe('border-l-green-500');
  });

  it('should return correct Tailwind border-left class for pink', () => {
    expect(getTabGroupBorderColorClass('pink')).toBe('border-l-pink-500');
  });

  it('should return correct Tailwind border-left class for purple', () => {
    expect(getTabGroupBorderColorClass('purple')).toBe('border-l-purple-500');
  });

  it('should return correct Tailwind border-left class for cyan', () => {
    expect(getTabGroupBorderColorClass('cyan')).toBe('border-l-cyan-500');
  });

  it('should return correct Tailwind border-left class for orange', () => {
    expect(getTabGroupBorderColorClass('orange')).toBe('border-l-orange-500');
  });

  it('should return all 9 Chrome tab group colors', () => {
    const colors: TabGroupColor[] = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
    const results = colors.map(color => getTabGroupBorderColorClass(color));

    // All results should be unique
    expect(new Set(results).size).toBe(9);

    // All results should follow the pattern border-l-{color}-500
    results.forEach(result => {
      expect(result).toMatch(/^border-l-\w+-500$/);
    });
  });

  it('should return transparent border for default case', () => {
    // @ts-expect-error Testing invalid input
    expect(getTabGroupBorderColorClass('invalid')).toBe('border-l-transparent');
  });

  it('should return transparent border for undefined input', () => {
    // @ts-expect-error Testing undefined input
    expect(getTabGroupBorderColorClass(undefined)).toBe('border-l-transparent');
  });
});
