export type DuplicateMatchMode = 'exact' | 'normalized';

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'ref',
]);

export const normalizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);

    // Remove fragment
    parsed.hash = '';

    // Remove tracking parameters
    for (const param of TRACKING_PARAMS) {
      parsed.searchParams.delete(param);
    }

    // Remove trailing slash from pathname (but keep "/" for root)
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    return parsed.toString();
  } catch {
    return url;
  }
};

const getMatchKey = (url: string, mode: DuplicateMatchMode): string => {
  return mode === 'normalized' ? normalizeUrl(url) : url;
};

export const findDuplicateTabs = (
  tabs: chrome.tabs.Tab[],
  mode: DuplicateMatchMode,
): Map<string, chrome.tabs.Tab[]> => {
  const groups = new Map<string, chrome.tabs.Tab[]>();

  for (const tab of tabs) {
    if (!tab.url) continue;

    // Skip special browser and extension URLs
    if (
      tab.url.startsWith('chrome://') ||
      tab.url.startsWith('chrome-extension://') ||
      tab.url.startsWith('edge://') ||
      tab.url.startsWith('about:')
    ) {
      continue;
    }

    const key = getMatchKey(tab.url, mode);
    const existing = groups.get(key);
    if (existing) {
      existing.push(tab);
    } else {
      groups.set(key, [tab]);
    }
  }

  // Only keep groups with 2+ tabs (actual duplicates)
  const duplicates = new Map<string, chrome.tabs.Tab[]>();
  for (const [key, groupTabs] of groups) {
    if (groupTabs.length >= 2) {
      duplicates.set(key, groupTabs);
    }
  }

  return duplicates;
};

export const countDuplicateTabs = (duplicates: Map<string, chrome.tabs.Tab[]>): number => {
  let count = 0;
  for (const tabs of duplicates.values()) {
    count += tabs.length - 1; // Subtract 1 for the "original" that would be kept
  }
  return count;
};

export const getTabsToClose = (duplicateTabs: chrome.tabs.Tab[]): chrome.tabs.Tab[] => {
  if (duplicateTabs.length <= 1) return [];

  // Keep the most recently accessed tab, close the rest
  const sorted = [...duplicateTabs].sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
  return sorted.slice(1);
};
