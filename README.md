# Microsoft Teams to Telegram Notification Forwarder

![Project Status](https://img.shields.io/badge/status-active-brightgreen)
![Version](https://img.shields.io/badge/version-2.4-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

A Chrome extension that intercepts browser notifications from Microsoft Teams and forwards them to a specified Telegram chat. It also keeps your Teams status "Active" even when you're not interacting with the tab.

## The Problem

This extension was built for users who rely exclusively on the web version of Microsoft Teams and find native browser notifications to be insufficient or easy to miss. If you can't use the desktop application, this tool ensures you never miss an important message by pushing all notifications directly to a Telegram chat, which is often more persistent and mobile-friendly.

## Key Features

- **Notification Forwarding**: Captures every browser notification from Teams and sends its title and body to your Telegram bot.
- **Status Keep-Alive**: A background task periodically simulates activity on the Teams tab, ensuring your status remains "Active" and doesn't switch to "Away".
- **Silent Interception**: Suppresses the original browser notification to prevent duplicates, so you only get notified in Telegram.
- **In-Popup Logging**: Click the extension icon to see a real-time log of events (interceptions, sent messages, errors) for easy debugging.
- **Broad Compatibility**: Works with both the standard `teams.microsoft.com` and corporate proxied versions (e.g., `teams.microsoft.com.mcas.ms`).

## How It Works

The extension uses a robust, modern approach to reliably capture notifications without being affected by changes in the Teams web app's HTML structure.

1.  **Script Injection**: A lightweight content script is injected into the Teams page. This script's sole purpose is to inject another script into the page's `MAIN` execution world, which is necessary to bypass the site's Content Security Policy (CSP).
2.  **Notification Monkey-Patching**: The main script uses `Object.defineProperty` to replace the browser's native `window.Notification` constructor with a custom function. It makes this new property non-writable, so the Teams application cannot overwrite it.
3.  **Returning a Mock Object**: When the Teams web app tries to create a notification (`new Notification(...)`), our custom function intercepts the call. It then returns a "mock" Notification object with empty properties and methods. This is a critical step that prevents the Teams app's code from crashing when it expects a valid object in return.
4.  **Communication Bridge**: The intercepted notification data is dispatched as a `CustomEvent` within the page. The content script listens for this event and forwards the data to the background service worker.
5.  **Background Service**: The service worker receives the notification data, formats it into a message, and sends it to the Telegram Bot API using the credentials you provide.

## Setup Guide

To use this extension, you'll need a Telegram Bot Token and a Chat ID.

### 1. Create a Telegram Bot

1.  Open Telegram and search for the `@BotFather` bot.
2.  Start a chat and send the `/newbot` command.
3.  Follow the instructions to choose a name and username for your bot.
4.  BotFather will give you a **Bot Token**. It will look something like `1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123456`. **Save this token.**

### 2. Get your Telegram Chat ID

1.  Create a new Telegram channel or group where you want to receive notifications.
2.  Add the bot you just created to the channel/group as an administrator.
3.  Find a bot like `@get_id_bot` on Telegram.
4.  Send any message from your channel/group to the `@get_id_bot` (by forwarding it).
5.  The bot will reply with your channel's **Chat ID**. It will be a number, likely starting with `-100...`. **Save this ID.**

### 3. Configure the Extension

1.  Clone or download this repository to your local machine.
2.  Open the project folder and find the `config.js` file.
3.  Replace the placeholder values with your actual Bot Token and Chat ID.

    ```javascript
    // config.js
    export const config = {
      botToken: 'YOUR_TELEGRAM_BOT_TOKEN', // Paste your token here
      chatId: 'YOUR_TELEGRAM_CHAT_ID'    // Paste your chat ID here
    };
    ```

### 4. Install the Extension in Chrome

Since this extension is not on the Chrome Web Store, you need to load it manually.

1.  Open Google Chrome and navigate to `chrome://extensions`.
2.  Enable **"Developer mode"** using the toggle in the top-right corner.
3.  Click the **"Load unpacked"** button that appears on the top-left.
4.  Select the entire project folder that you downloaded and configured.

The extension is now installed and active! It will automatically start working when you have a Microsoft Teams tab open.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
