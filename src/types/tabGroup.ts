// Type definition for Chrome Tab Groups API colors
export type TabGroupColor =
  | 'grey'
  | 'blue'
  | 'red'
  | 'yellow'
  | 'green'
  | 'pink'
  | 'purple'
  | 'cyan'
  | 'orange';

// Tab group information interface
export interface TabGroupInfo {
  id: number;
  color: TabGroupColor;
  title?: string;
  collapsed: boolean;
}
