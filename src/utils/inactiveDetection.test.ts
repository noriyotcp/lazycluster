import { describe, it, expect } from 'vitest';
import { findInactiveTabs, sortByInactivity, formatInactiveDuration } from './inactiveDetection';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const NOW = Date.now();

const makeTab = (overrides: Partial<chrome.tabs.Tab> = {}): chrome.tabs.Tab =>
  ({
    id: 1,
    index: 0,
    windowId: 1,
    active: false,
    pinned: false,
    highlighted: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
    url: 'https://example.com',
    title: 'Example',
    lastAccessed: NOW,
    ...overrides,
  }) as chrome.tabs.Tab;

describe('findInactiveTabs', () => {
  it('detects tabs older than threshold', () => {
    const tabs = [
      makeTab({ id: 1, lastAccessed: NOW - 4 * DAY_MS }),
      makeTab({ id: 2, lastAccessed: NOW - 1 * DAY_MS }),
      makeTab({ id: 3, lastAccessed: NOW }),
    ];

    const result = findInactiveTabs(tabs, 3 * DAY_MS, NOW);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('excludes active tabs', () => {
    const tabs = [makeTab({ id: 1, active: true, lastAccessed: NOW - 10 * DAY_MS })];

    const result = findInactiveTabs(tabs, 3 * DAY_MS, NOW);
    expect(result).toHaveLength(0);
  });

  it('excludes tabs without lastAccessed', () => {
    const tabs = [makeTab({ id: 1, lastAccessed: undefined })];

    const result = findInactiveTabs(tabs, 3 * DAY_MS, NOW);
    expect(result).toHaveLength(0);
  });

  it('includes tab exactly at threshold', () => {
    const tabs = [makeTab({ id: 1, lastAccessed: NOW - 3 * DAY_MS })];

    const result = findInactiveTabs(tabs, 3 * DAY_MS, NOW);
    expect(result).toHaveLength(1);
  });

  it('returns empty array when no tabs are inactive', () => {
    const tabs = [
      makeTab({ id: 1, lastAccessed: NOW }),
      makeTab({ id: 2, lastAccessed: NOW - 1 * DAY_MS }),
    ];

    const result = findInactiveTabs(tabs, 3 * DAY_MS, NOW);
    expect(result).toHaveLength(0);
  });

  it('handles different thresholds', () => {
    const tabs = [
      makeTab({ id: 1, lastAccessed: NOW - 2 * DAY_MS }),
      makeTab({ id: 2, lastAccessed: NOW - 5 * DAY_MS }),
    ];

    expect(findInactiveTabs(tabs, 1 * DAY_MS, NOW)).toHaveLength(2);
    expect(findInactiveTabs(tabs, 3 * DAY_MS, NOW)).toHaveLength(1);
    expect(findInactiveTabs(tabs, 7 * DAY_MS, NOW)).toHaveLength(0);
  });
});

describe('sortByInactivity', () => {
  it('sorts by lastAccessed ascending (oldest first)', () => {
    const tabs = [
      makeTab({ id: 1, lastAccessed: NOW - 1 * DAY_MS }),
      makeTab({ id: 2, lastAccessed: NOW - 5 * DAY_MS }),
      makeTab({ id: 3, lastAccessed: NOW - 3 * DAY_MS }),
    ];

    const result = sortByInactivity(tabs);

    expect(result.map(t => t.id)).toEqual([2, 3, 1]);
  });

  it('does not mutate original array', () => {
    const tabs = [
      makeTab({ id: 1, lastAccessed: 2000 }),
      makeTab({ id: 2, lastAccessed: 1000 }),
    ];
    const original = [...tabs];

    sortByInactivity(tabs);

    expect(tabs.map(t => t.id)).toEqual(original.map(t => t.id));
  });

  it('handles undefined lastAccessed (treated as 0)', () => {
    const tabs = [
      makeTab({ id: 1, lastAccessed: 1000 }),
      makeTab({ id: 2, lastAccessed: undefined }),
    ];

    const result = sortByInactivity(tabs);
    expect(result[0].id).toBe(2); // undefined → 0, oldest
  });
});

describe('formatInactiveDuration', () => {
  it('formats minutes', () => {
    expect(formatInactiveDuration(NOW - 30 * 60 * 1000, NOW)).toBe('30m ago');
  });

  it('formats hours', () => {
    expect(formatInactiveDuration(NOW - 5 * HOUR_MS, NOW)).toBe('5h ago');
  });

  it('formats days', () => {
    expect(formatInactiveDuration(NOW - 3 * DAY_MS, NOW)).toBe('3d ago');
  });

  it('formats weeks', () => {
    expect(formatInactiveDuration(NOW - 14 * DAY_MS, NOW)).toBe('2w ago');
  });

  it('formats 0 minutes for very recent', () => {
    expect(formatInactiveDuration(NOW - 1000, NOW)).toBe('0m ago');
  });
});
