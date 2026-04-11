import i18n from '@/i18n';

export const NOTIFICATION_NAVIGATE_EVENT = 'harmonie:notification-navigate';

export interface BrowserNotificationPayload {
  messageId: string;
  content: string | null;
  attachments: unknown[];
  targetUrl: string;
  title?: string;
}

const buildNotificationBody = (payload: BrowserNotificationPayload): string => {
  const content = payload.content?.trim() ?? '';
  if (content) return content;
  if (payload.attachments.length > 0) return i18n.t('notifications.browser.attachmentOnly');
  return i18n.t('notifications.browser.fallbackBody');
};

export const requestBrowserNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'default') return;

  void Notification.requestPermission().catch(() => {});
};

export const showBrowserNotification = (payload: BrowserNotificationPayload) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const notification = new Notification(payload.title ?? i18n.t('notifications.browser.title'), {
    body: buildNotificationBody(payload),
    tag: `message-${payload.messageId}`,
    icon: '/harmonie.png',
  });

  notification.onclick = () => {
    notification.close();
    window.focus();
    window.dispatchEvent(
      new CustomEvent<string>(NOTIFICATION_NAVIGATE_EVENT, { detail: payload.targetUrl })
    );
  };

  window.setTimeout(() => notification.close(), 5000);
};
