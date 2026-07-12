import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatGroupName,
  loadSavedTabGroups,
  saveSavedTabGroups,
  addSavedTabGroup,
  deleteSavedTabGroup,
  clearAllSavedTabGroups,
} from './savedTabs';
import type { SavedTabGroup } from '../types/savedTabs';

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
    const groups: SavedTabGroup[] = [{ id: '1', savedAt: 1000, tabs: [] }];
    await saveSavedTabGroups(groups);
    const result = await loadSavedTabGroups();
    expect(result).toEqual(groups);
  });
});

describe('addSavedTabGroup', () => {
  it('prepends new group to existing groups', async () => {
    const existing: SavedTabGroup[] = [{ id: 'old', savedAt: 1000, tabs: [] }];
    await saveSavedTabGroups(existing);

    const tabs = [{ url: 'https://example.com', title: 'Example', favIconUrl: undefined } as chrome.tabs.Tab];
    const group = await addSavedTabGroup(tabs);

    expect(group.tabs).toHaveLength(1);
    expect(group.tabs[0].url).toBe('https://example.com');

    const stored = await loadSavedTabGroups();
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
    await saveSavedTabGroups([
      { id: 'a', savedAt: 1000, tabs: [] },
      { id: 'b', savedAt: 2000, tabs: [] },
    ]);
    await deleteSavedTabGroup('a');
    const stored = await loadSavedTabGroups();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('b');
  });
});

describe('clearAllSavedTabGroups', () => {
  it('removes all stored groups', async () => {
    await saveSavedTabGroups([{ id: 'a', savedAt: 1000, tabs: [] }]);
    await clearAllSavedTabGroups();
    expect(await loadSavedTabGroups()).toEqual([]);
  });
});

// --- Serialization (mutex) tests ---
//
// Without serialization, two mutations that start within the same microtask
// window both read the same "existing" state via loadSavedTabGroups(); the
// second save then overwrites the first, silently losing changes. The mutex
// forces mutations into a FIFO chain so each one sees the previous one's
// committed state.

describe('mutation serialization', () => {
  it('preserves all groups when adds run in parallel', async () => {
    const tabsList = Array.from(
      { length: 5 },
      (_, i) => [{ url: `https://example.com/${i}`, title: `T${i}` } as chrome.tabs.Tab]
    );

    await Promise.all(tabsList.map(tabs => addSavedTabGroup(tabs)));

    const stored = await loadSavedTabGroups();
    expect(stored).toHaveLength(5);
    const urls = stored.map(g => g.tabs[0].url).sort();
    expect(urls).toEqual([
      'https://example.com/0',
      'https://example.com/1',
      'https://example.com/2',
      'https://example.com/3',
      'https://example.com/4',
    ]);
  });

  it('serializes add and delete such that both take effect', async () => {
    await saveSavedTabGroups([{ id: 'existing', savedAt: 1, tabs: [] }]);

    const newTabs = [{ url: 'https://new.com', title: 'New' } as chrome.tabs.Tab];
    await Promise.all([addSavedTabGroup(newTabs), deleteSavedTabGroup('existing')]);

    const stored = await loadSavedTabGroups();
    expect(stored).toHaveLength(1);
    expect(stored[0].tabs[0].url).toBe('https://new.com');
  });

  it('serializes clearAll and a following add in FIFO order', async () => {
    await saveSavedTabGroups([
      { id: 'a', savedAt: 1, tabs: [] },
      { id: 'b', savedAt: 2, tabs: [] },
    ]);

    // clearAll is queued first (sync), so it runs first, then the add sees an
    // empty store and persists the new group.
    const clearPromise = clearAllSavedTabGroups();
    const addPromise = addSavedTabGroup([{ url: 'https://after.com', title: 'After' } as chrome.tabs.Tab]);
    await Promise.all([clearPromise, addPromise]);

    const stored = await loadSavedTabGroups();
    expect(stored).toHaveLength(1);
    expect(stored[0].tabs[0].url).toBe('https://after.com');
  });

  it('keeps processing the queue after a rejected mutation', async () => {
    // Force the next set() to reject exactly once, so the mutation inside
    // the queue throws. The queue must still process subsequent mutations.
    const setMock = chrome.storage.local.set as unknown as ReturnType<typeof vi.fn>;
    setMock.mockImplementationOnce(async () => {
      throw new Error('quota exceeded');
    });

    const failing = addSavedTabGroup([{ url: 'https://fails.com', title: 'Fail' } as chrome.tabs.Tab]);
    const succeeding = addSavedTabGroup([{ url: 'https://ok.com', title: 'OK' } as chrome.tabs.Tab]);

    await expect(failing).rejects.toThrow('quota exceeded');
    await expect(succeeding).resolves.toBeDefined();

    const stored = await loadSavedTabGroups();
    expect(stored).toHaveLength(1);
    expect(stored[0].tabs[0].url).toBe('https://ok.com');
  });
});
