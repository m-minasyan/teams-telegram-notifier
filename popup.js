const LOGS_STORAGE_KEY = 'teams_notifier_logs';

function displayLogs(logs) {
    const container = document.getElementById('log-container');
    if (!logs || logs.length === 0) {
        container.textContent = 'No logs yet.';
        return;
    }

    container.textContent = logs
        .map(log => `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`)
        .join('\n');

    container.scrollTop = container.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(LOGS_STORAGE_KEY, (result) => {
        displayLogs(result[LOGS_STORAGE_KEY]);
    });

    document.getElementById('clear-logs').addEventListener('click', () => {
        chrome.storage.local.set({ [LOGS_STORAGE_KEY]: [] }, () => {
            displayLogs([]);
        });
    });
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[LOGS_STORAGE_KEY]) {
        displayLogs(changes[LOGS_STORAGE_KEY].newValue);
    }
});