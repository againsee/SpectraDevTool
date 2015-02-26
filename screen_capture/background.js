
chrome.notifications.onClicked.addListener(function(notifId) {
	console.error('chrome.notifications.onClicked');
});

chrome.notifications.onClosed.addListener(function(notifId, byUser) {
	console.error('chrome.notifications.onClosed');
});

chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
	console.error('chrome.notifications.onButtonClicked');
});

chrome.notifications.onShowSettings.addListener(function() {
	console.error('chrome.notifications.onShowSettings');
});