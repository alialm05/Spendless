// Background script for Mindfulness extension

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // Option 1: Open the options/home page
    chrome.runtime.openOptionsPage();
    
});

// Optional: Handle installation/update events
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Mindfulness extension installed');
        // Optionally open the home page on first install
        chrome.runtime.openOptionsPage();
    } else if (details.reason === 'update') {
        console.log('Mindfulness extension updated');
    }
});

// Optional: Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openHomePage') {
        chrome.runtime.openOptionsPage();
        sendResponse({ success: true });
    }
    
    if (request.action === 'getBudgetData') {
        // Handle budget data requests
        // You could store/retrieve data from chrome.storage here
        chrome.storage.sync.get(['budget', 'expenses'], (result) => {
            sendResponse(result);
        });
        return true; // Will respond asynchronously
    }
});

// Optional: Set up context menu items
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'openDashboard',
        title: 'Open Mindfulness Dashboard',
        contexts: ['action']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'openDashboard') {
        chrome.runtime.openOptionsPage();
    }
});
