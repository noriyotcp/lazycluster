import { createContext, useContext, useState, ReactNode } from 'react';
import { TabGroupColor } from '../types/tabGroup';

interface TabGroupColorContextType {
  getGroupColor: (groupId: number) => TabGroupColor | null;
  updateGroupColors: (tabs: chrome.tabs.Tab[]) => Promise<void>;
}

const TabGroupColorContext = createContext<TabGroupColorContextType | undefined>(undefined);

export const TabGroupColorProvider = ({ children }: { children: ReactNode }) => {
  const [groupColorMap, setGroupColorMap] = useState<Map<number, TabGroupColor>>(new Map());

  const getGroupColor = (groupId: number): TabGroupColor | null => {
    if (groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
      return null;
    }
    return groupColorMap.get(groupId) ?? null;
  };

  const updateGroupColors = async (tabs: chrome.tabs.Tab[]) => {
    // Extract unique group IDs from tabs
    const groupIds = new Set<number>();
    tabs.forEach(tab => {
      if (tab.groupId && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        groupIds.add(tab.groupId);
      }
    });

    // Fetch group colors for unique group IDs
    const newColorMap = new Map<number, TabGroupColor>();
    await Promise.all(
      Array.from(groupIds).map(async groupId => {
        try {
          const group = await chrome.tabGroups.get(groupId);
          newColorMap.set(groupId, group.color as TabGroupColor);
        } catch (error) {
          console.error(`Failed to fetch group ${groupId}:`, error);
        }
      }),
    );

    setGroupColorMap(newColorMap);
  };

  return (
    <TabGroupColorContext.Provider value={{ getGroupColor, updateGroupColors }}>
      {children}
    </TabGroupColorContext.Provider>
  );
};

export const useTabGroupColor = () => {
  const context = useContext(TabGroupColorContext);
  if (!context) {
    throw new Error('useTabGroupColor must be used within TabGroupColorProvider');
  }
  return context;
};
