async function toggleTabs() {  
  const recentTabs = await getRecentTabs();
  if (recentTabs.length > 1) {
    const previousTab = recentTabs[1];
    await chrome.windows.update(previousTab.windowId, { focused: true });
    await chrome.tabs.update(previousTab.id, { active: true });
  }
}

function getRecentTabs() {
  return chrome.tabs.query({})
    .then((tabs) => tabs.sort((a, b) => a.lastAccessed > b.lastAccessed ? -1 : 1));
}

// -----------------------------------------------------------------------------

chrome.commands.onCommand.addListener(async (command) => {
  switch (command) {
    case 'toggle-tabs':
      return toggleTabs();
  }
});
