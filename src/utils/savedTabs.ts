import type { SavedTabGroup } from '../types/savedTabs';

const STORAGE_KEY = 'lazycluster.savedTabGroups';

export async function loadSavedTabGroups(): Promise<SavedTabGroup[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as SavedTabGroup[]) ?? [];
}

export async function saveSavedTabGroups(groups: SavedTabGroup[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: groups });
}

export async function addSavedTabGroup(tabs: chrome.tabs.Tab[]): Promise<SavedTabGroup> {
  const group: SavedTabGroup = {
    id: crypto.randomUUID(),
    savedAt: Date.now(),
    tabs: tabs
      .filter(t => t.url)
      .map(t => ({ title: t.title ?? t.url ?? '', url: t.url!, favIconUrl: t.favIconUrl })),
  };
  const existing = await loadSavedTabGroups();
  await saveSavedTabGroups([group, ...existing]);
  return group;
}

export async function deleteSavedTabGroup(id: string): Promise<void> {
  const existing = await loadSavedTabGroups();
  await saveSavedTabGroups(existing.filter(g => g.id !== id));
}

export async function clearAllSavedTabGroups(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}

export function formatGroupName(savedAt: number): string {
  const date = new Date(savedAt);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month} ${day} · ${hours}:${minutes}`;
}
