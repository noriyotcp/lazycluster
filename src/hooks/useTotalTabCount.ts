import { useTabGroupContext } from '../contexts/TabGroupContext';

export const useTotalTabCount = (): number => {
  const { tabGroups } = useTabGroupContext();
  return tabGroups.reduce((total, group) => total + group.tabs.length, 0);
};
