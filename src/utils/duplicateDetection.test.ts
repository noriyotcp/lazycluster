import { describe, it, expect } from 'vitest';
import { normalizeUrl, findDuplicateTabs, countDuplicateTabs, getTabsToClose } from './duplicateDetection';

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
    lastAccessed: Date.now(),
    ...overrides,
  }) as chrome.tabs.Tab;

describe('normalizeUrl', () => {
  it('removes trailing slash', () => {
    expect(normalizeUrl('https://example.com/path/')).toBe('https://example.com/path');
  });

  it('keeps root path slash', () => {
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
  });

  it('removes fragment', () => {
    expect(normalizeUrl('https://example.com/page#section')).toBe('https://example.com/page');
  });

  it('removes utm parameters', () => {
    expect(normalizeUrl('https://example.com/page?utm_source=twitter&utm_medium=social&key=value')).toBe(
      'https://example.com/page?key=value',
    );
  });

  it('removes fbclid and gclid', () => {
    expect(normalizeUrl('https://example.com/page?fbclid=abc123')).toBe('https://example.com/page');
  });

  it('handles invalid URLs gracefully', () => {
    expect(normalizeUrl('not-a-url')).toBe('not-a-url');
  });

  it('preserves non-tracking query parameters', () => {
    expect(normalizeUrl('https://example.com/search?q=test&page=2')).toBe(
      'https://example.com/search?q=test&page=2',
    );
  });

  it('removes multiple tracking params at once', () => {
    const url = 'https://example.com/page?utm_source=x&utm_medium=y&utm_campaign=z&ref=abc&id=123';
    expect(normalizeUrl(url)).toBe('https://example.com/page?id=123');
  });
});

describe('findDuplicateTabs', () => {
  it('detects exact URL duplicates', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/page' }),
      makeTab({ id: 2, url: 'https://example.com/page' }),
      makeTab({ id: 3, url: 'https://other.com' }),
    ];

    const result = findDuplicateTabs(tabs, 'normalized');

    expect(result.size).toBe(1);
    const group = result.get('https://example.com/page')!;
    expect(group).toHaveLength(2);
    expect(group.map(t => t.id)).toEqual([1, 2]);
  });

  it('returns empty map when no duplicates', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://a.com' }),
      makeTab({ id: 2, url: 'https://b.com' }),
    ];

    const result = findDuplicateTabs(tabs, 'normalized');
    expect(result.size).toBe(0);
  });

  it('detects normalized duplicates (trailing slash difference)', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/path/' }),
      makeTab({ id: 2, url: 'https://example.com/path' }),
    ];

    const result = findDuplicateTabs(tabs, 'normalized');
    expect(result.size).toBe(1);
  });

  it('detects normalized duplicates (fragment difference)', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/page#top' }),
      makeTab({ id: 2, url: 'https://example.com/page#bottom' }),
    ];

    const result = findDuplicateTabs(tabs, 'normalized');
    expect(result.size).toBe(1);
  });

  it('detects normalized duplicates (tracking param difference)', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/page?utm_source=twitter' }),
      makeTab({ id: 2, url: 'https://example.com/page' }),
    ];

    const result = findDuplicateTabs(tabs, 'normalized');
    expect(result.size).toBe(1);
  });

  it('skips chrome:// URLs', () => {
    const tabs = [
      makeTab({ id: 1, url: 'chrome://extensions' }),
      makeTab({ id: 2, url: 'chrome://extensions' }),
    ];

    const result = findDuplicateTabs(tabs, 'normalized');
    expect(result.size).toBe(0);
  });

  it('skips tabs without URL', () => {
    const tabs = [makeTab({ id: 1, url: undefined }), makeTab({ id: 2, url: undefined })];

    const result = findDuplicateTabs(tabs, 'normalized');
    expect(result.size).toBe(0);
  });

  it('handles multiple duplicate groups', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://a.com' }),
      makeTab({ id: 2, url: 'https://a.com' }),
      makeTab({ id: 3, url: 'https://b.com' }),
      makeTab({ id: 4, url: 'https://b.com' }),
      makeTab({ id: 5, url: 'https://c.com' }),
    ];

    const result = findDuplicateTabs(tabs, 'normalized');
    expect(result.size).toBe(2);
  });

  it('handles tabs across different windows', () => {
    const tabs = [
      makeTab({ id: 1, windowId: 1, url: 'https://example.com' }),
      makeTab({ id: 2, windowId: 2, url: 'https://example.com' }),
    ];

    const result = findDuplicateTabs(tabs, 'normalized');
    expect(result.size).toBe(1);
  });
});

describe('countDuplicateTabs', () => {
  it('counts excess tabs (total - 1 per group)', () => {
    const duplicates = new Map<string, chrome.tabs.Tab[]>([
      ['https://a.com', [makeTab({ id: 1 }), makeTab({ id: 2 }), makeTab({ id: 3 })]],
      ['https://b.com', [makeTab({ id: 4 }), makeTab({ id: 5 })]],
    ]);

    expect(countDuplicateTabs(duplicates)).toBe(3); // (3-1) + (2-1) = 3
  });

  it('returns 0 for empty map', () => {
    expect(countDuplicateTabs(new Map())).toBe(0);
  });
});

describe('getTabsToClose', () => {
  it('keeps the most recently accessed tab', () => {
    const tabs = [
      makeTab({ id: 1, lastAccessed: 1000 }),
      makeTab({ id: 2, lastAccessed: 3000 }),
      makeTab({ id: 3, lastAccessed: 2000 }),
    ];

    const result = getTabsToClose(tabs);

    expect(result).toHaveLength(2);
    expect(result.map(t => t.id)).toEqual([3, 1]); // sorted desc, skip first (id:2)
  });

  it('returns empty array for single tab', () => {
    expect(getTabsToClose([makeTab({ id: 1 })])).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(getTabsToClose([])).toEqual([]);
  });

  it('handles undefined lastAccessed', () => {
    const tabs = [
      makeTab({ id: 1, lastAccessed: undefined }),
      makeTab({ id: 2, lastAccessed: 1000 }),
    ];

    const result = getTabsToClose(tabs);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1); // undefined lastAccessed treated as 0, so closed
  });
});

describe('findDuplicateTabs with title-domain mode', () => {
  it('groups tabs with same title and domain', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/page1', title: 'My Page' }),
      makeTab({ id: 2, url: 'https://example.com/page2?q=foo', title: 'My Page' }),
    ];
    const result = findDuplicateTabs(tabs, 'title-domain');
    expect(result.size).toBe(1);
    const group = Array.from(result.values())[0];
    expect(group).toHaveLength(2);
  });

  it('does not group tabs with same domain but different titles', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/page1', title: 'Page One' }),
      makeTab({ id: 2, url: 'https://example.com/page2', title: 'Page Two' }),
    ];
    const result = findDuplicateTabs(tabs, 'title-domain');
    expect(result.size).toBe(0);
  });

  it('does not group tabs with same title but different domains', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/page', title: 'Dashboard' }),
      makeTab({ id: 2, url: 'https://other.com/page', title: 'Dashboard' }),
    ];
    const result = findDuplicateTabs(tabs, 'title-domain');
    expect(result.size).toBe(0);
  });

  it('handles tabs with empty titles', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/a', title: '' }),
      makeTab({ id: 2, url: 'https://example.com/b', title: '' }),
    ];
    const result = findDuplicateTabs(tabs, 'title-domain');
    expect(result.size).toBe(1);
  });

  it('handles tabs with undefined titles', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/a', title: undefined }),
      makeTab({ id: 2, url: 'https://example.com/b', title: undefined }),
    ];
    const result = findDuplicateTabs(tabs, 'title-domain');
    expect(result.size).toBe(1);
  });

  it('detects duplicates that exact and normalized modes miss', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://github.com/user/repo/pull/197', title: 'PR #197' }),
      makeTab({ id: 2, url: 'https://github.com/user/repo/pull/197/commits', title: 'PR #197' }),
    ];
    expect(findDuplicateTabs(tabs, 'normalized').size).toBe(0);
    expect(findDuplicateTabs(tabs, 'normalized').size).toBe(0);
    expect(findDuplicateTabs(tabs, 'title-domain').size).toBe(1);
  });
});
