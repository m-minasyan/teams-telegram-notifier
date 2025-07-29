import { config } from './config.js';

const TEAMS_HOSTS = ["teams.microsoft.com", "teams.microsoft.com.mcas.ms"];
const TEAMS_URL_FILTER = { url: TEAMS_HOSTS.map(host => ({ hostEquals: host })) };
const LOGS_STORAGE_KEY = 'teams_notifier_logs';
const MAX_LOGS = 100;

async function logMessage(message) {
    const { [LOGS_STORAGE_KEY]: logs = [] } = await chrome.storage.local.get(LOGS_STORAGE_KEY);

    const newLog = {
        timestamp: new Date().toISOString(),
        message: message
    };
    logs.push(newLog);

    if (logs.length > MAX_LOGS) {
        logs.shift();
    }

    await chrome.storage.local.set({ [LOGS_STORAGE_KEY]: logs });
}

function injectInterceptor(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['main_world_script.js'],
        world: 'MAIN',
    })
        .then(() => logMessage('Interceptor injected.'))
        .catch(err => logMessage(`ERROR: Injection failed. ${err.message}`));
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        try {
            if (TEAMS_HOSTS.includes(new URL(tab.url).hostname)) {
                injectInterceptor(tabId);
            }
        } catch (e) { }
    }
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    logMessage('SPA navigation detected, re-injecting interceptor.');
    injectInterceptor(details.tabId);
}, TEAMS_URL_FILTER);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'nativeNotification') {
        logMessage(`Notification received: "${request.notification.title}"`);
        formatAndSendTelegramMessage(request.notification);
    }
    return true;
});

async function formatAndSendTelegramMessage({ title, body }) {
    if (!config.botToken || !config.chatId || config.botToken === 'YOUR_TELEGRAM_BOT_TOKEN') {
        await logMessage('ERROR: Telegram credentials not configured.');
        return;
    }

    const text = `<b>${title}</b>\n${body}`;
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: config.chatId, text, parse_mode: 'HTML' })
        });

        const data = await response.json();

        if (data.ok) {
            await logMessage('Successfully sent to Telegram.');
        } else {
            await logMessage(`ERROR: Telegram API - ${data.description || 'Unknown error'}`);
        }
    } catch (error) {
        await logMessage(`ERROR: Failed to send message. ${error.message}`);
    }
}

const KEEP_ALIVE_ALARM = 'teamsKeepAlive';
chrome.alarms.create(KEEP_ALIVE_ALARM, { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === KEEP_ALIVE_ALARM) {
        try {
            const tabs = await chrome.tabs.query({ url: TEAMS_HOSTS.map(h => `https://${h}/*`) });
            if (tabs.length > 0) {
                for (const tab of tabs) {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id, allFrames: true },
                        world: 'MAIN',
                        func: () => {
                            const eventInit = {
                                bubbles: true,
                                cancelable: true,
                                view: window,
                                key: 'Shift',
                                code: 'ShiftLeft',
                                keyCode: 16,
                                which: 16,
                                shiftKey: true,
                            };
                            window.dispatchEvent(new KeyboardEvent('keydown', eventInit));
                        }
                    }).catch(err => {
                        if (!err.message.includes('No tab with id') && !err.message.includes('cannot be scripted')) {
                            logMessage(`WARN: Keep-alive for tab ${tab.id} failed: ${err.message}`);
                        }
                    });
                }
                logMessage(`Keep-alive signal sent to ${tabs.length} Teams tab(s).`);
            }
        } catch (err) {
            logMessage(`ERROR: Keep-alive task failed. ${err.message}`);
        }
    }
});

chrome.runtime.onInstalled.addListener(() => {
    logMessage("Extension installed/updated.");
});