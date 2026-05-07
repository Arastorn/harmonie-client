import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMatch, useParams } from 'react-router-dom';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { useUser } from '@/features/user/UserContext';
import type { MessageCreatedEvent } from '@/types/channel';
import type { ConversationMessageCreatedEvent } from '@/types/conversation';
import {
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from '@/shared/notifications/browserNotification';
import { REALTIME_SERVER_EVENTS } from './constants';

interface MessageActivityContextValue {
  totalUnreadCount: number;
  hasUnreadChannel: (channelId: string) => boolean;
  hasUnreadGuild: (guildId: string) => boolean;
  hasUnreadConversation: (conversationId: string) => boolean;
  hasAnyUnreadConversation: () => boolean;
}

const MessageActivityContext = createContext<MessageActivityContextValue>({
  totalUnreadCount: 0,
  hasUnreadChannel: () => false,
  hasUnreadGuild: () => false,
  hasUnreadConversation: () => false,
  hasAnyUnreadConversation: () => false,
});

const toSenderName = (
  authorUserId: string,
  displayName?: string | null,
  username?: string | null
) => {
  const display = displayName?.trim();
  if (display && display !== authorUserId) return display;

  const user = username?.trim();
  if (user && user !== authorUserId) return user;

  return undefined;
};

const toTitlePart = (value: string | null | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed || fallback;
};

const isDirectConversation = (conversationType: string) =>
  conversationType.trim().toLowerCase() === 'direct';

export const MessageActivityProvider = ({ children }: { children: ReactNode }) => {
  const { connection } = useRealtime();
  const { user } = useUser();
  const { guildId: currentRouteGuildId } = useParams<{ guildId: string }>();
  const textChannelMatch = useMatch('/guilds/:guildId/channels/:channelId');
  const activeTextChannelId = textChannelMatch?.params.channelId;
  const conversationMatch = useMatch('/conversations/:conversationId');
  const activeConversationId = conversationMatch?.params.conversationId;
  const [unreadChannels, setUnreadChannels] = useState<Record<string, number>>({});
  const [unreadGuilds, setUnreadGuilds] = useState<Record<string, number>>({});
  const [unreadConversations, setUnreadConversations] = useState<Record<string, number>>({});
  const [unreadCurrentRoute, setUnreadCurrentRoute] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUserInteraction = () => requestBrowserNotificationPermission();

    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  // Clear current-route unread when the tab regains focus
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleFocus = () => setUnreadCurrentRoute(0);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Guild channel messages
  useEffect(() => {
    if (!connection) return;

    const handleMessageCreated = (event: MessageCreatedEvent) => {
      if (event.authorUserId === user?.userId) return;

      const targetUrl = `/guilds/${event.guildId}/channels/${event.channelId}`;
      const senderName =
        toSenderName(event.authorUserId, event.authorDisplayName, event.authorUsername) ??
        event.authorUserId;
      const title = `${toTitlePart(event.guildName, event.guildId)} | ${toTitlePart(
        event.channelName,
        event.channelId
      )} | ${senderName}`;

      const notify = () =>
        showBrowserNotification({
          messageId: event.messageId,
          content: event.content,
          attachments: event.attachments,
          targetUrl,
          title,
        });

      if (event.guildId !== currentRouteGuildId) {
        setUnreadGuilds((prev) => ({ ...prev, [event.guildId]: (prev[event.guildId] ?? 0) + 1 }));
        setUnreadChannels((prev) => ({
          ...prev,
          [event.channelId]: (prev[event.channelId] ?? 0) + 1,
        }));
        notify();
        return;
      }

      if (event.channelId !== activeTextChannelId) {
        setUnreadChannels((prev) => ({
          ...prev,
          [event.channelId]: (prev[event.channelId] ?? 0) + 1,
        }));
        notify();
        return;
      }

      // Same channel but tab not focused: notify and increment title counter
      if (!document.hasFocus()) setUnreadCurrentRoute((n) => n + 1);
      notify();
    };

    connection.on(REALTIME_SERVER_EVENTS.messageCreated, handleMessageCreated);
    return () => connection.off(REALTIME_SERVER_EVENTS.messageCreated, handleMessageCreated);
  }, [connection, currentRouteGuildId, activeTextChannelId, user?.userId]);

  // Conversation messages
  useEffect(() => {
    if (!connection) return;

    const handleConversationMessageCreated = (event: ConversationMessageCreatedEvent) => {
      if (event.authorUserId === user?.userId) return;

      const targetUrl = `/conversations/${event.conversationId}`;
      const senderName =
        toSenderName(event.authorUserId, event.authorDisplayName, event.authorUsername) ??
        event.authorUserId;
      const conversationName = event.conversationName?.trim();
      const title =
        isDirectConversation(event.conversationType) || !conversationName
          ? senderName
          : `${conversationName} | ${senderName}`;

      const notify = () =>
        showBrowserNotification({
          messageId: event.messageId,
          content: event.content,
          attachments: event.attachments ?? [],
          targetUrl,
          title,
        });

      if (event.conversationId !== activeConversationId) {
        setUnreadConversations((prev) => ({
          ...prev,
          [event.conversationId]: (prev[event.conversationId] ?? 0) + 1,
        }));
        notify();
        return;
      }

      // Same conversation but tab not focused: notify and increment title counter
      if (!document.hasFocus()) setUnreadCurrentRoute((n) => n + 1);
      notify();
    };

    connection.on(
      REALTIME_SERVER_EVENTS.conversationMessageCreated,
      handleConversationMessageCreated
    );
    return () =>
      connection.off(
        REALTIME_SERVER_EVENTS.conversationMessageCreated,
        handleConversationMessageCreated
      );
  }, [connection, activeConversationId, user?.userId]);

  useEffect(() => {
    if (!activeTextChannelId) return;
    setUnreadChannels((prev) => {
      if (!(activeTextChannelId in prev)) return prev;
      const next = { ...prev };
      delete next[activeTextChannelId];
      return next;
    });
  }, [activeTextChannelId]);

  useEffect(() => {
    if (!currentRouteGuildId) return;
    setUnreadGuilds((prev) => {
      if (!(currentRouteGuildId in prev)) return prev;
      const next = { ...prev };
      delete next[currentRouteGuildId];
      return next;
    });
  }, [currentRouteGuildId]);

  useEffect(() => {
    if (!activeConversationId) return;
    setUnreadConversations((prev) => {
      if (!(activeConversationId in prev)) return prev;
      const next = { ...prev };
      delete next[activeConversationId];
      return next;
    });
  }, [activeConversationId]);

  const value = useMemo<MessageActivityContextValue>(
    () => ({
      totalUnreadCount:
        Object.values(unreadChannels).reduce((sum, count) => sum + count, 0) +
        Object.values(unreadGuilds).reduce((sum, count) => sum + count, 0) +
        Object.values(unreadConversations).reduce((sum, count) => sum + count, 0) +
        unreadCurrentRoute,
      hasUnreadChannel: (channelId: string) => (unreadChannels[channelId] ?? 0) > 0,
      hasUnreadGuild: (guildId: string) => (unreadGuilds[guildId] ?? 0) > 0,
      hasUnreadConversation: (conversationId: string) =>
        (unreadConversations[conversationId] ?? 0) > 0,
      hasAnyUnreadConversation: () => Object.values(unreadConversations).some((c) => c > 0),
    }),
    [unreadChannels, unreadGuilds, unreadConversations, unreadCurrentRoute]
  );

  return (
    <MessageActivityContext.Provider value={value}>{children}</MessageActivityContext.Provider>
  );
};

export const useMessageActivity = () => useContext(MessageActivityContext);
