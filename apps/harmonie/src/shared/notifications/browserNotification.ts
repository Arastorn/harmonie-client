import i18n from '@/i18n';
import type { MessageCreatedEvent } from '@/types/channel';

export const NOTIFICATION_NAVIGATE_EVENT = 'harmonie:notification-navigate';

interface BrowserNotificationOptions {
  title?: string;
}

const buildNotificationTargetUrl = (event: MessageCreatedEvent) =>
  `/guilds/${event.guildId}/channels/${event.channelId}`;

const buildNotificationBody = (event: MessageCreatedEvent) => {
  const content = event.content.trim();
  if (content) return content;
  if (event.attachments.length > 0) return i18n.t('notifications.browser.attachmentOnly');
  return i18n.t('notifications.browser.fallbackBody');
};

export const requestBrowserNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'default') return;

  void Notification.requestPermission().catch(() => {});
};

export const showBrowserNotification = (
  event: MessageCreatedEvent,
  options?: BrowserNotificationOptions
) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const notification = new Notification(options?.title ?? i18n.t('notifications.browser.title'), {
    body: buildNotificationBody(event),
    tag: `message-${event.messageId}`,
    icon: '/anchor.png',
  });

  notification.onclick = () => {
    notification.close();
    window.focus();
    window.dispatchEvent(
      new CustomEvent<string>(NOTIFICATION_NAVIGATE_EVENT, {
        detail: buildNotificationTargetUrl(event),
      })
    );
  };

  window.setTimeout(() => notification.close(), 5000);
};
