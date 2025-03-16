import React, { useEffect, useState } from 'react';
import './style.css';

interface Tab {
  id: number;
  title: string;
}

function Manager() {
  const [tabs, setTabs] = useState<Tab[]>([]);

  useEffect(() => {
    // Connect to background script
    const connection = chrome.runtime.connect({ name: "manager" });

    connection.onMessage.addListener((message) => {
      if (message.type === "UPDATE_TABS") {
        setTabs(message.tabs);
      } else if (message.type === "BACKGROUND_INITIALIZED") {
        console.log("Background script initialized");
      }
    });

    // Request initial data
    connection.postMessage({ type: "REQUEST_INITIAL_DATA" });
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
