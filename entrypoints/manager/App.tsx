import React, { useEffect, useState } from 'react';
import { Tab } from '@/src/@types/types';
import './style.css';

type Message = { type: string; tabs: Tab[] };

interface TabGroup {
  windowId: number;
  tabs: Tab[];
}

const Manager = () => {
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<number | null>(null);

  useEffect(() => {
    // Connect to background script
    const connection = chrome.runtime.connect({ name: "manager" });

    const handleMessage = (message: Message) => {
      if (message.type === "UPDATE_TABS") {
        const groupedTabs = groupTabsByWindow(message.tabs);
        setTabGroups(groupedTabs);
      } else if (message.type === "BACKGROUND_INITIALIZED") {
        console.log("Background script initialized");
      }
    };

    connection.onMessage.addListener(handleMessage);

    // Request initial data
    connection.postMessage({ type: "REQUEST_INITIAL_DATA" });

    // Get active window id
    chrome.windows.getCurrent().then(window => {
      if (window.id !== undefined) {
        setActiveWindowId(window.id);
      }
    });

    return () => {
      connection.onMessage.removeListener(handleMessage);
      connection.disconnect();
    };
  }, []);

  const groupTabsByWindow = (tabs: Tab[]): TabGroup[] => {
    const groups: { [windowId: number]: Tab[] } = {};
    tabs.forEach(tab => {
      if (tab.windowId) {
        if (!groups[tab.windowId]) {
          groups[tab.windowId] = [];
        }
        groups[tab.windowId].push(tab);
      }
    });

    return Object.entries(groups).map(([windowId, tabs]) => ({
      windowId: parseInt(windowId),
      tabs,
    }));
  };

  return (
    <div>
      <h1>Open Tabs</h1>
      {tabGroups.map((group, index) => (
        <div key={group.windowId}>
          <h2>
            {group.windowId === activeWindowId ? "Current Window" : `Window ${index + 1}`}
          </h2>
          <ul>
            {group.tabs.map(tab => (
              <li key={tab.id}>{tab.title}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default Manager;
