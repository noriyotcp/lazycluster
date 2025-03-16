export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  // Function to send tabs to manager
  const sendTabsToManager = async () => {
    const tabs = await browser.tabs.query({});
    browser.runtime.sendMessage({ type: "UPDATE_TABS", tabs });
  };

  // Listen for tab creation
  browser.tabs.onCreated.addListener(() => {
    sendTabsToManager();
  });

  // Listen for tab updates
  browser.tabs.onUpdated.addListener(() => {
    sendTabsToManager();
  });

  // Listen for tab removal
  browser.tabs.onRemoved.addListener(() => {
    sendTabsToManager();
  });

  // Send initial tab list when background script is loaded
  sendTabsToManager();
});
