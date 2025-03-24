import TabItem from './TabItem';
import type { Tabs } from 'webextension-polyfill';
import { useTabSelectionContext } from '../../src/contexts/TabSelectionContext';

interface TabListProps {
  tabs: Tabs.Tab[];
  handleCloseTab: (tabId: number) => void;
  focusTab: (tabId: number, windowId: number) => void;
  onCheckAllTabsChange: (checked: boolean) => void;
}

const TabList = ({ tabs, handleCloseTab, focusTab, onCheckAllTabsChange }: TabListProps) => {
  const { selectedTabIds } = useTabSelectionContext();

  const isAnyTabChecked = tabs.some(tab => selectedTabIds.includes(tab.id!));

  useEffect(() => {
    onCheckAllTabsChange(isAnyTabChecked);
  }, [isAnyTabChecked, onCheckAllTabsChange]);

  return (
    <ul className="list shadow-md">
      {tabs.map(tab => (
        <TabItem key={tab.id} tab={tab} handleCloseTab={handleCloseTab} focusTab={focusTab} />
      ))}
    </ul>
  );
};

export default TabList;
