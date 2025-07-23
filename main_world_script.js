if (!window.isNotificationInterceptorActive) {
    const OriginalNotification = window.Notification;

    class MockNotification {
        constructor(title, options) {
            this.title = title;
            this.body = options?.body || '';
            this.tag = options?.tag || '';
            this.icon = options?.icon || '';
            this.onclick = null;
            this.onshow = null;
            this.onerror = null;
            this.onclose = null;
        }

        close() { }
    }

    Object.defineProperty(window, 'Notification', {
        value: function (title, options) {
            window.dispatchEvent(new CustomEvent('InterceptedNotification', {
                detail: {
                    title: title,
                    body: options?.body || ''
                }
            }));

            return new MockNotification(title, options);
        },
        writable: false,
        configurable: true
    });

    window.Notification.requestPermission = OriginalNotification.requestPermission.bind(OriginalNotification);
    window.Notification.permission = OriginalNotification.permission;

    Object.defineProperty(window.Notification, 'maxActions', {
        get: () => OriginalNotification.maxActions
    });

    window.isNotificationInterceptorActive = true;
}