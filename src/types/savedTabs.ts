export interface SavedTab {
  title: string;
  url: string;
  favIconUrl?: string;
}

export interface SavedTabGroup {
  id: string;
  savedAt: number;
  tabs: SavedTab[];
}
