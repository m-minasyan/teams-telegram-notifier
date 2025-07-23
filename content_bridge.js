window.addEventListener('InterceptedNotification', (event) => {
    chrome.runtime.sendMessage({
        type: 'nativeNotification',
        notification: event.detail
    }, (response) => {
        if (chrome.runtime.lastError) {
        }
    });
});