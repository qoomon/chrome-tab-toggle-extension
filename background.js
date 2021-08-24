let recentTab
let previousTab

async function toggleTabs() {
  let [activeTab] = await chrome.tabs.query({
    currentWindow: true,
    active: true
  })
  let targetTab = activeTab ? previousTab : recentTab
  if (targetTab) {
    await chrome.windows.update(targetTab.windowId, {
      focused: true
    })
    return chrome.tabs.update(targetTab.id, {
      active: true
    })
  }
}

function onTabFocusChanged(windowId, tabId) {
  console.debug("tab focus changed");
  if(!recentTab || recentTab.id !== tabId){
    console.debug("recent tab changed");
    previousTab = recentTab
    recentTab = {
      id: tabId,
      windowId: windowId
    }
  }
}

// -----------------------------------------------------------------------------

chrome.tabs.onActivated.addListener(async (info) => {
  onTabFocusChanged(info.windowId, info.tabId)
})

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return
  }
  let [activeTab] = await chrome.tabs.query({
    windowId: windowId,
    active: true
  })
  onTabFocusChanged(windowId, activeTab.id)
})

chrome.tabs.onRemoved.addListener(async (tabId, info) => {
  if(previousTab.id === tabId){
    previousTab = undefined
  }
})

// -----------------------------------------------------------------------------

chrome.commands.onCommand.addListener(async (command) => {
  console.debug(`command: ${command}`)
  switch (command) {
    case 'toggle-tabs':
      return toggleTabs()
  }
})

