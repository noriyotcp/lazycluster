import React, { useEffect, useState } from 'react';
import './style.css';

interface Tab {
  id: number;
  title: string;
}

type Message = { type: string; tabs: Tab[] };

const Manager = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);

  useEffect(() => {
    // Connect to background script
    const connection = chrome.runtime.connect({ name: "manager" });

    const handleMessage = (message: Message) => {
      if (message.type === "UPDATE_TABS") {
        setTabs(message.tabs);
      } else if (message.type === "BACKGROUND_INITIALIZED") {
        console.log("Background script initialized");
      }
    };

    connection.onMessage.addListener(handleMessage);

    // Request initial data
    connection.postMessage({ type: "REQUEST_INITIAL_DATA" });

    return () => {
      connection.onMessage.removeListener(handleMessage);
      connection.disconnect();
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
