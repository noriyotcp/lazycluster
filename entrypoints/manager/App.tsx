import React, { useEffect, useState } from 'react';
import './style.css';

interface Tab {
  id: number;
  title: string;
}

function Manager() {
  const [tabs, setTabs] = useState<Tab[]>([]);

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === "UPDATE_TABS") {
        setTabs(message.tabs as Tab[]);
      }
    };

    browser.runtime.onMessage.addListener(handleMessage);

    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
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
