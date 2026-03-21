export const DEFAULT_INACTIVE_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export const INACTIVE_THRESHOLD_PRESETS = [
  { label: '1 day', value: 1 * 24 * 60 * 60 * 1000 },
  { label: '3 days', value: 3 * 24 * 60 * 60 * 1000 },
  { label: '7 days', value: 7 * 24 * 60 * 60 * 1000 },
] as const;

export const findInactiveTabs = (
  tabs: chrome.tabs.Tab[],
  thresholdMs: number,
  now: number = Date.now(),
): chrome.tabs.Tab[] => {
  return tabs.filter(tab => {
    // Skip active tabs
    if (tab.active) return false;

    // Skip tabs without lastAccessed
    if (tab.lastAccessed == null) return false;

    return now - tab.lastAccessed >= thresholdMs;
  });
};

export const sortByInactivity = (tabs: chrome.tabs.Tab[]): chrome.tabs.Tab[] => {
  return [...tabs].sort((a, b) => (a.lastAccessed ?? 0) - (b.lastAccessed ?? 0));
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

export const formatInactiveDuration = (lastAccessed: number, now: number = Date.now()): string => {
  const diff = now - lastAccessed;

  if (diff < HOUR_MS) {
    const minutes = Math.floor(diff / MINUTE_MS);
    return `${minutes}m ago`;
  }
  if (diff < DAY_MS) {
    const hours = Math.floor(diff / HOUR_MS);
    return `${hours}h ago`;
  }
  if (diff < WEEK_MS) {
    const days = Math.floor(diff / DAY_MS);
    return `${days}d ago`;
  }
  const weeks = Math.floor(diff / WEEK_MS);
  return `${weeks}w ago`;
};
