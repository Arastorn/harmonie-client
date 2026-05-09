import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMatch, useParams } from 'react-router-dom';
import { useChannels } from '@/features/channel/ChannelContext';
import { useConversations } from '@/features/conversation/ConversationContext';
import { useGuilds } from '@/features/guild/GuildContext';
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

const addEntity = (prev: Record<string, number>, entityId: string) => ({
  ...prev,
  [entityId]: (prev[entityId] ?? 0) + 1,
});

const removeRecordEntry = <T,>(prev: Record<string, T>, entityId: string) => {
  if (!(entityId in prev)) return prev;
  const next = { ...prev };
  delete next[entityId];
  return next;
};

const markCleared = (prev: Record<string, boolean>, entityId: string) =>
  prev[entityId] ? prev : { ...prev, [entityId]: true };

const hasInitialUnread =
  (initialUnreadIds: Set<string>, clearedIds: Record<string, boolean>) => (entityId: string) =>
    initialUnreadIds.has(entityId) && !clearedIds[entityId];

const countInitialUnread = (initialUnreadIds: Set<string>, clearedIds: Record<string, boolean>) => {
  let count = 0;
  initialUnreadIds.forEach((entityId) => {
    if (!clearedIds[entityId]) count += 1;
  });
  return count;
};

export const MessageActivityProvider = ({ children }: { children: ReactNode }) => {
  const { connection } = useRealtime();
  const { user } = useUser();
  const { guilds } = useGuilds();
  const { channels } = useChannels();
  const { conversations } = useConversations();
  const { guildId: currentRouteGuildId } = useParams<{ guildId: string }>();
  const textChannelMatch = useMatch('/guilds/:guildId/channels/:channelId');
  const activeTextChannelId = textChannelMatch?.params.channelId;
  const conversationMatch = useMatch('/conversations/:conversationId');
  const activeConversationId = conversationMatch?.params.conversationId;
  const [unreadChannels, setUnreadChannels] = useState<Record<string, number>>({});
  const [unreadGuilds, setUnreadGuilds] = useState<Record<string, number>>({});
  const [unreadConversations, setUnreadConversations] = useState<Record<string, number>>({});
  const [clearedInitialChannels, setClearedInitialChannels] = useState<Record<string, boolean>>({});
  const [clearedInitialGuilds, setClearedInitialGuilds] = useState<Record<string, boolean>>({});
  const [clearedInitialConversations, setClearedInitialConversations] = useState<
    Record<string, boolean>
  >({});
  const [channelGuildIds, setChannelGuildIds] = useState<Record<string, string>>({});
  const [unreadCurrentRoute, setUnreadCurrentRoute] = useState(0);

  const initialUnreadChannels = useMemo(
    () =>
      new Set(
        (channels ?? [])
          .filter((channel) => channel.type === 'Text' && channel.hasUnread)
          .map((channel) => channel.channelId)
      ),
    [channels]
  );

  const initialUnreadGuilds = useMemo(
    () => new Set(guilds.filter((guild) => guild.hasUnread).map((guild) => guild.guildId)),
    [guilds]
  );

  const initialUnreadConversations = useMemo(
    () =>
      new Set(
        (conversations ?? [])
          .filter((conversation) => conversation.hasUnread)
          .map((conversation) => conversation.conversationId)
      ),
    [conversations]
  );

  useEffect(() => {
    if (!currentRouteGuildId || !channels) return;
    setChannelGuildIds((prev) => ({
      ...prev,
      ...Object.fromEntries(channels.map((channel) => [channel.channelId, currentRouteGuildId])),
    }));
  }, [channels, currentRouteGuildId]);

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
        setChannelGuildIds((prev) => ({ ...prev, [event.channelId]: event.guildId }));
        setClearedInitialGuilds((prev) => removeRecordEntry(prev, event.guildId));
        setClearedInitialChannels((prev) => removeRecordEntry(prev, event.channelId));
        setUnreadGuilds((prev) => addEntity(prev, event.guildId));
        setUnreadChannels((prev) => addEntity(prev, event.channelId));
        notify();
        return;
      }

      if (event.channelId !== activeTextChannelId) {
        setChannelGuildIds((prev) => ({ ...prev, [event.channelId]: event.guildId }));
        setClearedInitialChannels((prev) => removeRecordEntry(prev, event.channelId));
        setUnreadChannels((prev) => addEntity(prev, event.channelId));
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
        setClearedInitialConversations((prev) => removeRecordEntry(prev, event.conversationId));
        setUnreadConversations((prev) => addEntity(prev, event.conversationId));
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
    setUnreadChannels((prev) => removeRecordEntry(prev, activeTextChannelId));
    setClearedInitialChannels((prev) => markCleared(prev, activeTextChannelId));
  }, [activeTextChannelId]);

  useEffect(() => {
    if (!activeTextChannelId || !currentRouteGuildId) return;

    const hasOtherRealtimeUnreadChannel = Object.keys(unreadChannels).some(
      (channelId) =>
        channelId !== activeTextChannelId && channelGuildIds[channelId] === currentRouteGuildId
    );
    const hasOtherInitialUnreadChannel = (channels ?? []).some(
      (channel) =>
        channel.type === 'Text' &&
        channel.channelId !== activeTextChannelId &&
        channel.hasUnread &&
        !clearedInitialChannels[channel.channelId]
    );

    if (hasOtherRealtimeUnreadChannel || hasOtherInitialUnreadChannel) return;

    setUnreadGuilds((prev) => removeRecordEntry(prev, currentRouteGuildId));
    setClearedInitialGuilds((prev) => markCleared(prev, currentRouteGuildId));
  }, [
    activeTextChannelId,
    channels,
    channelGuildIds,
    clearedInitialChannels,
    currentRouteGuildId,
    unreadChannels,
  ]);

  useEffect(() => {
    if (!activeConversationId) return;
    setUnreadConversations((prev) => removeRecordEntry(prev, activeConversationId));
    setClearedInitialConversations((prev) => markCleared(prev, activeConversationId));
  }, [activeConversationId]);

  const value = useMemo<MessageActivityContextValue>(() => {
    const hasInitialUnreadChannel = hasInitialUnread(initialUnreadChannels, clearedInitialChannels);
    const hasInitialUnreadGuild = hasInitialUnread(initialUnreadGuilds, clearedInitialGuilds);
    const hasInitialUnreadConversation = hasInitialUnread(
      initialUnreadConversations,
      clearedInitialConversations
    );
    const hasUnreadCurrentGuildChannel = (guildId: string) =>
      currentRouteGuildId === guildId &&
      (Object.keys(unreadChannels).some((channelId) => channelGuildIds[channelId] === guildId) ||
        countInitialUnread(initialUnreadChannels, clearedInitialChannels) > 0);

    return {
      totalUnreadCount:
        Object.values(unreadChannels).reduce((sum, count) => sum + count, 0) +
        Object.values(unreadGuilds).reduce((sum, count) => sum + count, 0) +
        Object.values(unreadConversations).reduce((sum, count) => sum + count, 0) +
        countInitialUnread(initialUnreadChannels, clearedInitialChannels) +
        countInitialUnread(initialUnreadGuilds, clearedInitialGuilds) +
        countInitialUnread(initialUnreadConversations, clearedInitialConversations) +
        unreadCurrentRoute,
      hasUnreadChannel: (channelId: string) =>
        (unreadChannels[channelId] ?? 0) > 0 || hasInitialUnreadChannel(channelId),
      hasUnreadGuild: (guildId: string) =>
        (unreadGuilds[guildId] ?? 0) > 0 ||
        hasInitialUnreadGuild(guildId) ||
        hasUnreadCurrentGuildChannel(guildId),
      hasUnreadConversation: (conversationId: string) =>
        (unreadConversations[conversationId] ?? 0) > 0 ||
        hasInitialUnreadConversation(conversationId),
      hasAnyUnreadConversation: () =>
        Object.values(unreadConversations).some((c) => c > 0) ||
        countInitialUnread(initialUnreadConversations, clearedInitialConversations) > 0,
    };
  }, [
    unreadChannels,
    unreadGuilds,
    unreadConversations,
    initialUnreadChannels,
    initialUnreadGuilds,
    initialUnreadConversations,
    clearedInitialChannels,
    clearedInitialGuilds,
    clearedInitialConversations,
    channelGuildIds,
    currentRouteGuildId,
    unreadCurrentRoute,
  ]);

  return (
    <MessageActivityContext.Provider value={value}>{children}</MessageActivityContext.Provider>
  );
};

export const useMessageActivity = () => useContext(MessageActivityContext);
