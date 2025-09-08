import { useTabGroupContext } from '../contexts/TabGroupContext';

export const useWindowTabCount = (windowId: number): number => {
  const { tabGroups } = useTabGroupContext();
  const tabGroup = tabGroups.find(group => group.windowId === windowId);
  return tabGroup?.tabs.length ?? 0;
};
