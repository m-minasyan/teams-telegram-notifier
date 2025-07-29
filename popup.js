// Teams Notifier Extension - Popup functionality
const LOGS_STORAGE_KEY = 'teams_notifier_logs';
let logCount = 0;
const logContainer = document.getElementById('log-container');
const logStats = document.getElementById('log-stats');
const clearBtn = document.getElementById('clear-logs');

function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function determineLogLevel(message) {
    const msgLower = message.toLowerCase();
    if (msgLower.includes('error') || msgLower.includes('failed') || msgLower.includes('exception')) {
        return 'error';
    } else if (msgLower.includes('warning') || msgLower.includes('warn') || msgLower.includes('limit')) {
        return 'warning';
    } else {
        return 'info';
    }
}

function getIconForLevel(level) {
    switch (level) {
        case 'error':
            return '🔥';
        case 'warning':
            return '⚠️';
        case 'info':
        default:
            return 'ℹ️';
    }
}

function addLogEntry(log, animate = true) {
    const entry = document.createElement('div');
    const level = log.level || determineLogLevel(log.message);
    entry.className = `log-entry log-level-${level}`;

    if (animate) {
        entry.style.opacity = '0';
        entry.style.transform = 'translateX(20px)';
    }

    const icon = getIconForLevel(level);

    // Use spans for inline layout to make logs more compact
    entry.innerHTML = `
        <div class="log-icon">${icon}</div>
        <div class="log-content">
            <span class="log-timestamp">${formatTimestamp(log.timestamp)}</span>
            <span class="log-message-text">${log.message.trim()}</span>
        </div>
    `;

    logContainer.appendChild(entry);

    if (animate) {
        // Trigger animation after a brief delay
        setTimeout(() => {
            entry.style.transition = 'all 0.5s ease-out';
            entry.style.opacity = '1';
            entry.style.transform = 'translateX(0)';
        }, 50);
    }

    return entry;
}

function updateStats() {
    logStats.textContent = `${logCount} event${logCount !== 1 ? 's' : ''} logged`;
}

function displayLogs(logs) {
    logContainer.innerHTML = '';
    logCount = 0;

    if (!logs || logs.length === 0) {
        logContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <div>No events logged yet</div>
            </div>
        `;
        updateStats();
        return;
    }

    // Add logs with animation
    logs.forEach(log => {
        addLogEntry(log, true);
        logCount++;
    });
    updateStats();

    // Scroll to the bottom after rendering
    setTimeout(() => {
        logContainer.scrollTop = logContainer.scrollHeight;
    }, 100);
}

function clearLogs() {
    const entries = logContainer.querySelectorAll('.log-entry');

    if (entries.length === 0) {
        return;
    }

    // Animate entries out
    entries.forEach((entry, index) => {
        setTimeout(() => {
            entry.style.transition = 'all 0.3s ease-out';
            entry.style.transform = 'translateX(100px)';
            entry.style.opacity = '0';
            setTimeout(() => entry.remove(), 300);
        }, index * 50);
    });

    // Clear storage and show empty state
    setTimeout(() => {
        chrome.storage.local.set({ [LOGS_STORAGE_KEY]: [] }, () => {
            logContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✨</div>
                    <div>All events cleared</div>
                </div>
            `;
            logCount = 0;
            updateStats();
        });
    }, entries.length * 50 + 300);
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load logs from storage
    chrome.storage.local.get(LOGS_STORAGE_KEY, (result) => {
        displayLogs(result[LOGS_STORAGE_KEY]);
    });

    // Set up clear button event listener
    clearBtn.addEventListener('click', clearLogs);
});

// Listen for storage changes to update display in real-time
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[LOGS_STORAGE_KEY]) {
        const newLogs = changes[LOGS_STORAGE_KEY].newValue;
        const oldLogs = changes[LOGS_STORAGE_KEY].oldValue || [];

        // If new logs were added (not cleared), animate only the new entries
        if (newLogs && newLogs.length > oldLogs.length) {
            const newEntries = newLogs.slice(oldLogs.length);

            // If container is empty or in empty state, reload all logs
            if (logContainer.querySelector('.empty-state') || logCount === 0) {
                displayLogs(newLogs);
            } else {
                // Just add the new entries with animation
                newEntries.forEach((log, index) => {
                    setTimeout(() => {
                        addLogEntry(log, true);
                        logCount++;
                        updateStats();

                        // Auto-scroll to bottom
                        setTimeout(() => {
                            logContainer.scrollTop = logContainer.scrollHeight;
                        }, 100);
                    }, index * 200);
                });
            }
        } else {
            // Full reload for other cases (cleared, etc.)
            displayLogs(newLogs);
        }
    }
});