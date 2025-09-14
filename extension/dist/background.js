// Background script for EcoTrack extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('EcoTrack extension installed');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCarbonData') {
    // Forward request to get carbon data
    chrome.storage.local.get(['carbonCache'], (result) => {
      sendResponse({ carbonCache: result.carbonCache || {} });
    });
    return true; // Keep message channel open for async response
  }
});

// Optional: Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('amazon.com')) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleModal' });
  }
});
