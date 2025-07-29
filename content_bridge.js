window.addEventListener('InterceptedNotification', (event) => {
    chrome.runtime.sendMessage({
        type: 'nativeNotification',
        notification: event.detail
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.log('Extension context invalidated. This is expected during extension reloads.');
        }
    });
});