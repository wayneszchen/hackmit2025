// Offset Extension Background Script
chrome.runtime.onInstalled.addListener(() => {
  console.log('Offset extension installed');
  
  // Initialize storage with default values
  chrome.storage.local.set({
    totalSavings: 0,
    totalPoints: 0,
    streak: 0,
    lastActivity: null
  });
});

// Listen for tab updates to detect product pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (isProductPage(tab.url)) {
      // Show page action for product pages
      chrome.action.setBadgeText({
        tabId: tabId
      });
      
      chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: '#22c55e'
      });
    } else {
      // Clear badge for non-product pages
      chrome.action.setBadgeText({
        tabId: tabId,
        text: ''
      });
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    updateUserStats(request.data);
    sendResponse({ success: true });
  } else if (request.action === 'getStats') {
    getUserStats().then(stats => {
      sendResponse(stats);
    });
    return true; // Keep message channel open for async response
  }
});

// Handle extension icon click - open webapp
chrome.action.onClicked.addListener((tab) => {
  const WEB_APP_URL = 'http://localhost:3000';
  // Open the web app in a new tab
  chrome.tabs.create({ 
    url: WEB_APP_URL,
    active: true 
  });
});

function isProductPage(url) {
  return url.includes('amazon.com/dp/') || 
         url.includes('amazon.com/gp/product/') ||
         url.includes('target.com/p/') ||
         url.includes('walmart.com/ip/');
}

async function updateUserStats(data) {
  const current = await chrome.storage.local.get(['totalSavings', 'totalPoints', 'streak']);
  
  const newStats = {
    totalSavings: (current.totalSavings || 0) + (data.co2Saved || 0),
    totalPoints: (current.totalPoints || 0) + (data.pointsEarned || 0),
    streak: data.maintainedStreak ? (current.streak || 0) + 1 : current.streak || 0,
    lastActivity: new Date().toISOString()
  };
  
  await chrome.storage.local.set(newStats);
}

async function getUserStats() {
  return await chrome.storage.local.get(['totalSavings', 'totalPoints', 'streak', 'lastActivity']);
}
