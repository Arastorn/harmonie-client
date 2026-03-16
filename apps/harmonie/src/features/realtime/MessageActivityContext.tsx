import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMatch, useParams } from 'react-router-dom';
import { useChannels } from '@/features/channel/ChannelContext';
import { useGuilds } from '@/features/guild/GuildContext';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import type { MessageCreatedEvent } from '@/types/channel';
import {
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from '@/shared/notifications/browserNotification';

interface MessageActivityContextValue {
  totalUnreadCount: number;
  hasUnreadChannel: (channelId: string) => boolean;
  hasUnreadGuild: (guildId: string) => boolean;
}

const MessageActivityContext = createContext<MessageActivityContextValue>({
  totalUnreadCount: 0,
  hasUnreadChannel: () => false,
  hasUnreadGuild: () => false,
});

export const MessageActivityProvider = ({ children }: { children: ReactNode }) => {
  const { guilds } = useGuilds();
  const { channels } = useChannels();
  const { connection } = useRealtime();
  const { guildId: currentRouteGuildId } = useParams<{ guildId: string }>();
  const textChannelMatch = useMatch('/guilds/:guildId/channels/:channelId');
  const activeTextChannelId = textChannelMatch?.params.channelId;
  const [unreadChannels, setUnreadChannels] = useState<Record<string, number>>({});
  const [unreadGuilds, setUnreadGuilds] = useState<Record<string, number>>({});

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

  useEffect(() => {
    if (!connection) return;

    const handleMessageCreated = (event: MessageCreatedEvent) => {
      const guildName =
        guilds.find((guild) => guild.guildId === event.guildId)?.name ?? event.guildId;
      const channelName =
        channels?.find((channel) => channel.channelId === event.channelId)?.name ?? event.channelId;
      const notificationTitle = `Harmonie | ${channelName} | ${guildName}`;

      const notifyAway = () => {
        if (typeof document === 'undefined') return;
        if (document.visibilityState === 'visible' && document.hasFocus()) return;
        showBrowserNotification(event, { title: notificationTitle });
      };

      if (event.guildId !== currentRouteGuildId) {
        setUnreadGuilds((prev) => ({
          ...prev,
          [event.guildId]: (prev[event.guildId] ?? 0) + 1,
        }));
        notifyAway();
        return;
      }

      if (event.channelId !== activeTextChannelId) {
        setUnreadChannels((prev) => ({
          ...prev,
          [event.channelId]: (prev[event.channelId] ?? 0) + 1,
        }));
        notifyAway();
        return;
      }

      notifyAway();
    };

    connection.on('MessageCreated', handleMessageCreated);

    return () => connection.off('MessageCreated', handleMessageCreated);
  }, [channels, connection, currentRouteGuildId, activeTextChannelId, guilds]);

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

  const value = useMemo<MessageActivityContextValue>(
    () => ({
      totalUnreadCount:
        Object.values(unreadChannels).reduce((sum, count) => sum + count, 0) +
        Object.values(unreadGuilds).reduce((sum, count) => sum + count, 0),
      hasUnreadChannel: (channelId: string) => (unreadChannels[channelId] ?? 0) > 0,
      hasUnreadGuild: (guildId: string) => (unreadGuilds[guildId] ?? 0) > 0,
    }),
    [unreadChannels, unreadGuilds]
  );

  return (
    <MessageActivityContext.Provider value={value}>{children}</MessageActivityContext.Provider>
  );
};

export const useMessageActivity = () => useContext(MessageActivityContext);
