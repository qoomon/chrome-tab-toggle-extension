function addPromiseSupportToStorageArea(storageArea) {
  if(!storageArea._promiseSupport){
    Object.getOwnPropertyNames(storageArea)
      .filter(property => typeof storageArea[property] === 'function')
      .forEach(functionName => {
        const originFunctionName = `_${functionName}`
        storageArea[originFunctionName] = storageArea[functionName]
        storageArea[functionName] = (...args) => { 
          if(typeof args[args.length - 1] === 'function'){
            return storageArea[originFunctionName](...args)
          }
          return new Promise((resolve, reject) => {
          storageArea[originFunctionName](...args, (...args) => {
            if (chrome.runtime.lastError) {
              return reject(chrome.runtime.lastError)
            }
            resolve(...args)
          })
        })}
      })
      storageArea._promiseSupport = true
    }
}

async function storageAreaProxy(cache, storageArea) {
  addPromiseSupportToStorageArea(storageArea)
  Object.assign(cache, await storageArea.get())
  return new Proxy(cache, {
    get: function(target, property, receiver) {
      return Reflect.get(target, property, receiver);
    },
    set: function(target, property, value, receiver) {
      storageArea.set({
        [property]: value
      })
      Reflect.set(target, property, value, receiver)
      return true;
    }
  })
}

  
// -----------------------------------------------------------------------------

;(async function main() {
  
  const storage = await storageAreaProxy({}, chrome.storage.local)


  async function toggleTabs() {
    let [activeTab] = await chrome.tabs.query({
      currentWindow: true,
      active: true
    })

    let targetTab = activeTab ? storage.previousTab : storage.recentTab
    if (targetTab) {
      await chrome.windows.update(targetTab.windowId, {
        focused: true
      })
      return chrome.tabs.update(targetTab.id, {
        active: true
      })
    }
  }

  async function onTabFocusChanged(windowId, tabId) {
    console.debug("tab focus changed")
    if (!storage.recentTab || storage.recentTab.id !== tabId) {
      console.debug("recent tab changed")
      storage.previousTab = storage.recentTab
      storage.recentTab = {
        id: tabId,
        windowId: windowId
      }
    }
  }

  async function onTabClosed(windowId, tabId) {
    console.debug("tab closed");
    if (storage.recentTab.id === tabId) {
      storage.recentTab = undefined
    } else if (storage.previousTab.id === tabId) {
      storage.previousTab = undefined
    }
  }


  // -----------------------------------------------------------------------------

  chrome.tabs.onActivated.addListener(async (info) => {
    return onTabFocusChanged(info.windowId, info.tabId)
  })

  chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      return
    }

    let [activeTab] = await chrome.tabs.query({
      windowId: windowId,
      active: true
    })

    return onTabFocusChanged(windowId, activeTab.id)
  })

  chrome.tabs.onRemoved.addListener(async (tabId, info) => {
    return onTabClosed(info.windowId, tabId)
  })


  // -----------------------------------------------------------------------------

  chrome.commands.onCommand.addListener(async (command) => {
    console.debug(`command: ${command}`)
    switch (command) {
      case 'toggle-tabs':
        return toggleTabs()
    }
  })
  
})()