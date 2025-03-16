import React, { useEffect, useState } from 'react';
import './style.css';

interface Tab {
  id: number;
  title: string;
}

function Manager() {
  const [tabs, setTabs] = useState<Tab[]>([]);

  useEffect(() => {
    chrome.tabs.query({}, (results) => {
      setTabs(results as Tab[]);
    });
  }, []);

  return (
    <div>
      <h1>Open Tabs</h1>
      <ul id="tabList">
        {tabs.map((tab) => (
          <li key={tab.id}>{tab.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default Manager;
