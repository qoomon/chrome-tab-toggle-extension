console.log("popup.js loading...")

document.addEventListener('keyup', (event) => {
  chrome.runtime.sendMessage({ action: "TOGGLE_DONE" });
  window.close();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "CLOSE_POPUP") {
    window.close();
  }
});

function getRecentTabs() {
  return chrome.tabs.query({})
    .then((tabs) => tabs.sort((a, b) => a.lastAccessed > b.lastAccessed ? -1 : 1));
}

async function main() {
  const toggleTabIndex = await chrome.runtime.sendMessage({action: "GET_TOGGLE_TAB_INDEX"})
    .then(response => response.toggleTabIndex);
  console.log("Toggle Tab Index:", toggleTabIndex);
  
  const recentTabs = await getRecentTabs();
  const tabList = document.getElementById('tab-list');
  const tabTemplate = document.getElementById('tab-template');
  recentTabs.forEach((tab, index) => {
    const tabElement = tabTemplate.content.cloneNode(true);
    
    const tabFaviconElement = tabElement.getElementById('tab-favicon');
    const tabFaviconImg = tabFaviconElement.querySelector('img');
    tabFaviconImg.src = tab.favIconUrl || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAB8UlEQVR4AcRV7W3CQAxNKgaAn0iAyAawAWzQjtAN2gmqTtBu0BHaDWAD2CAVRMrPdoBI6XtWbN1HQhBtRXWO7+xnv/P5rtwk//x3fYLj8biCbCB1ILuiKBZ9B9BZAZIxcY0EG8gKEo5FXdc74OqyLOehU9etBNjZCwBMDJV8J0mynk6nqUpVVSPYbGCdNzFm00lEQCB29tAAmHiExNtmLWowGHzJxPkwhrGOSaYeAUslkB7syktMH4+DQn+bMBZ+7zg9AiTNGZim6TLLMh4NlyLqk8Xpjx6toIwA5dmNmEwme/Fe+HGrMAKU98Z80HfUv5QnjTcCGKSC2Wz2gXk00Gi7RZxHAN9gfXAJfMgfrSICnF/4YmWNHskFUF5c1UznqttsEYGCQ43ezEmu9vF4/MmjcoU29at2CbzHpIBQgyR6ZIo5HA63zdxuoUvw3Dj71LALgPfzTh/0PTXFCFDqWRUwqE3QI7mF9LnvyAjogKwhrQMbsGsaAvI8H6JHO9rDRnsESLJFea8EnivoyQpJpS+MDRvtETApynskkPNTwsQQJpb/PYxhbBgTERBAIHbl3XMkk/egGjgm1oavGQNbNFoJiGKpODJsLF1ibdcOcx28FPy9YG84V7unOwkUhZ3tQbSEMJErTN6ZWON7CRR4qf4BAAD//0I36XsAAAAGSURBVAMAtTPrMVa3pBIAAAAASUVORK5CYII=';
    
    const tabTitleElement = tabElement.getElementById('tab-title');
    tabTitleElement.textContent = tab.title || tab.url || 'Untitled';
    
    if (index === toggleTabIndex) {
      tabElement.firstElementChild.classList.add('selected');
    }
    
    tabElement.firstElementChild.addEventListener('click', () => {
      chrome.windows.update(tab.windowId, { focused: true });
      chrome.tabs.update(tab.id, { active: true });
      window.close();
    });
    
    tabList.appendChild(tabElement);
  });
}
main();