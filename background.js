let toggleIndex = 0;

async function onToggleTabs(shift) {  
  toggleIndex += shift ?? 1;
  console.log("Toggle Index:", toggleIndex);
  await reopenPopup();
}

async function onToggleDone(){
  const recentTabs = await getRecentTabs();
  if (recentTabs.length > 1) {
    const previousTab = recentTabs[toggleIndex % recentTabs.length];
    await chrome.windows.update(previousTab.windowId, { focused: true });
    await chrome.tabs.update(previousTab.id, { active: true });
  }
  toggleIndex = 0;
}

let isReopening = false;
async function reopenPopup() {
  if (isReopening) return;
  isReopening = true;

  try {
    while (true) {
      try {
        await chrome.action.openPopup();
        break;
      } catch {
        await chrome.runtime.sendMessage({ action: "CLOSE_POPUP" }).catch(() => {});
      }
    }
  } finally {
    isReopening = false;
  }
}

async function onToggleDone() {
  const recentTabs = await getRecentTabs();
  if (recentTabs.length > 1) {
    console.log("Final Toggle Index:", toggleIndex);
    const toggleIndexTab = recentTabs[toggleIndex % recentTabs.length];
    await chrome.windows.update(toggleIndexTab.windowId, { focused: true });
    await chrome.tabs.update(toggleIndexTab.id, { active: true });
  }
  toggleIndex = 0;
}

function getRecentTabs() {
  return chrome.tabs.query({})
    .then((tabs) => tabs.sort((a, b) => a.lastAccessed > b.lastAccessed ? -1 : 1));
}

// -----------------------------------------------------------------------------

chrome.commands.onCommand.addListener(async (command) => {
  switch (command) {
    case 'toggle-tabs-back':
      return onToggleTabs(+1);
    case 'toggle-tabs-forward':
      return onToggleTabs(-1);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);
  switch (message.action) {
    case "TOGGLE_DONE":
      onToggleDone();
      return;
    case "GET_TOGGLE_TAB_INDEX":
      sendResponse({ toggleTabIndex: toggleIndex });
      return;
  }
});