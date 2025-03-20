import React from 'react';

interface TabItemProps {
  tab: chrome.tabs.Tab;
}

const TabItem: React.FC<TabItemProps> = ({ tab }) => {
  const handleCloseTab = () => {
    if (tab.id) {
      chrome.tabs.remove(tab.id);
    }
  };

  return (
    <li className="tab-item-container">
      {tab.favIconUrl && <img src={tab.favIconUrl} alt="Favicon" className="tab-favicon" />}
      <span className="tab-title">{tab.title}</span>
      <button onClick={handleCloseTab}>Close</button>
    </li>
  );
};

export default TabItem;
