import React, { useEffect, useState } from 'react';
import './style.css';

interface Tab {
  id: number;
  title: string;
}

function Manager() {
  const [tabs, setTabs] = useState<Tab[]>([]);

  useEffect(() => {
    type Message = { type: string; tabs: Tab[] };
    const handleMessage = (message: Message) => {
      if (message.type === "UPDATE_TABS") {
        setTabs(message.tabs);
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
