export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  let port: chrome.runtime.Port | null = null;

  // Function to get tabs
  const getTabs = async () => {
    const tabs = await browser.tabs.query({});
    return tabs;
  };

  // Listen for tab creation
  browser.tabs.onCreated.addListener(async () => {
    const tabs = await getTabs();
    if (port) {
      port.postMessage({ type: "UPDATE_TABS", tabs });
    }
  });

  // Listen for tab updates
  browser.tabs.onUpdated.addListener(async () => {
    const tabs = await getTabs();
    if (port) {
      port.postMessage({ type: "UPDATE_TABS", tabs });
    }
  });

  // Listen for tab removal
  browser.tabs.onRemoved.addListener(async () => {
    const tabs = await getTabs();
    if (port) {
      port.postMessage({ type: "UPDATE_TABS", tabs });
    }
  });

  browser.runtime.onConnect.addListener((p) => {
    if (p.name === "manager") {
      port = p;
      port.onDisconnect.addListener(() => {
        port = null;
      });

      port.onMessage.addListener(async (message) => {
        if (message.type === "REQUEST_INITIAL_DATA") {
          const tabs = await getTabs();
          if (port) { // Add this check
            port.postMessage({ type: "UPDATE_TABS", tabs });
            port.postMessage({ type: "BACKGROUND_INITIALIZED" });
          }
        }
      });
    }
  });
});
