import TabItem from './TabItem';
import type { Tabs } from 'webextension-polyfill';

interface TabListProps {
  tabs: Tabs.Tab[];
  handleCloseTab: (tabId: number) => void;
  focusTab: (tabId: number, windowId: number) => void;
}

const TabList = ({ tabs, handleCloseTab, focusTab }: TabListProps) => (
  <ul className="list shadow-md">
    {tabs.map(tab => (
      <TabItem key={tab.id} tab={tab} handleCloseTab={handleCloseTab} focusTab={focusTab} />
    ))}
  </ul>
);

export default TabList;
