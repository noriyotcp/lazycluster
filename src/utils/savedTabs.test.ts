import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatGroupName, loadSavedTabGroups, addSavedTabGroup, deleteSavedTabGroup, clearAllSavedTabGroups } from './savedTabs';

// --- formatGroupName (pure function) ---

describe('formatGroupName', () => {
  it('formats a timestamp as "Mon DD · HH:MM"', () => {
    // 2026-03-30 14:32:00 UTC+9 (JST) → depends on locale, so use a known timestamp
    // Use a fixed date: 2026-01-05 09:07:00 local time
    const date = new Date(2026, 0, 5, 9, 7, 0); // Jan 5, 09:07
    const result = formatGroupName(date.getTime());
    expect(result).toBe('Jan 5 · 09:07');
  });

  it('zero-pads hours and minutes', () => {
    const date = new Date(2026, 5, 3, 8, 4, 0); // Jun 3, 08:04
    const result = formatGroupName(date.getTime());
    expect(result).toBe('Jun 3 · 08:04');
  });

  it('formats double-digit day correctly', () => {
    const date = new Date(2026, 11, 25, 23, 59, 0); // Dec 25, 23:59
    const result = formatGroupName(date.getTime());
    expect(result).toBe('Dec 25 · 23:59');
  });
});

// --- Storage CRUD functions (chrome.storage.local mock) ---

const mockStorage: Record<string, unknown> = {};

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn(async (key: string) => ({ [key]: mockStorage[key] })),
      set: vi.fn(async (obj: Record<string, unknown>) => {
        Object.assign(mockStorage, obj);
      }),
      remove: vi.fn(async (key: string) => {
        delete mockStorage[key];
      }),
    },
  },
});

vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' });

const STORAGE_KEY = 'lazycluster.savedTabGroups';

beforeEach(() => {
  Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  vi.clearAllMocks();
});

describe('loadSavedTabGroups', () => {
  it('returns empty array when storage is empty', async () => {
    const result = await loadSavedTabGroups();
    expect(result).toEqual([]);
  });

  it('returns stored groups', async () => {
    const groups = [{ id: '1', savedAt: 1000, tabs: [] }];
    mockStorage[STORAGE_KEY] = groups;
    const result = await loadSavedTabGroups();
    expect(result).toEqual(groups);
  });
});

describe('addSavedTabGroup', () => {
  it('prepends new group to existing groups', async () => {
    const existing = [{ id: 'old', savedAt: 1000, tabs: [] }];
    mockStorage[STORAGE_KEY] = existing;

    const tabs = [
      { url: 'https://example.com', title: 'Example', favIconUrl: undefined } as chrome.tabs.Tab,
    ];
    const group = await addSavedTabGroup(tabs);

    expect(group.tabs).toHaveLength(1);
    expect(group.tabs[0].url).toBe('https://example.com');

    const stored = mockStorage[STORAGE_KEY] as typeof existing;
    expect(stored[0].id).toBe('test-uuid');
    expect(stored[1].id).toBe('old');
  });

  it('filters out tabs without url', async () => {
    const tabs = [
      { url: 'https://a.com', title: 'A' } as chrome.tabs.Tab,
      { url: undefined, title: 'No URL' } as chrome.tabs.Tab,
    ];
    const group = await addSavedTabGroup(tabs);
    expect(group.tabs).toHaveLength(1);
  });
});

describe('deleteSavedTabGroup', () => {
  it('removes group with matching id', async () => {
    mockStorage[STORAGE_KEY] = [
      { id: 'a', savedAt: 1000, tabs: [] },
      { id: 'b', savedAt: 2000, tabs: [] },
    ];
    await deleteSavedTabGroup('a');
    const stored = mockStorage[STORAGE_KEY] as Array<{ id: string }>;
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('b');
  });
});

describe('clearAllSavedTabGroups', () => {
  it('removes the storage key', async () => {
    mockStorage[STORAGE_KEY] = [{ id: 'a', savedAt: 1000, tabs: [] }];
    await clearAllSavedTabGroups();
    expect(mockStorage[STORAGE_KEY]).toBeUndefined();
  });
});
