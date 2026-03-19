import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { differenceInMinutes, format, isSameDay } from 'date-fns';
import { IconButton, Separator } from '@harmonie/ui';
import { deleteMessage, getChannelMessages } from '@/api/channels';
import type { Message, MessageCreatedEvent, MessageDeletedEvent } from '@/types/channel';
import type { GuildMember } from '@/types/guild';
import { useMemberBanActions } from '@/features/guild/hooks/useMemberBanActions';
import { useGuildMembers, useGuilds } from '@/features/guild/GuildContext';
import { useChannels } from '@/features/channel/ChannelContext';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { useUser } from '@/features/user/UserContext';
import { MemberPopover } from '@/shared/components/MemberPopover';
import type { MainLayoutOutletContext } from '@/layouts/MainLayout';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';

interface SelectedMember {
  member: GuildMember;
  rect: DOMRect;
}

const MESSAGE_GROUPING_WINDOW_MINUTES = 10;

const areMessagesGrouped = (previousMessage?: Message, currentMessage?: Message) => {
  if (!previousMessage || !currentMessage) return false;
  if (previousMessage.authorUserId !== currentMessage.authorUserId) return false;

  return (
    differenceInMinutes(
      new Date(currentMessage.createdAtUtc),
      new Date(previousMessage.createdAtUtc)
    ) < MESSAGE_GROUPING_WINDOW_MINUTES
  );
};

const getDaySeparatorLabel = (previousMessage?: Message, currentMessage?: Message) => {
  if (!previousMessage || !currentMessage) return null;

  const previousDate = new Date(previousMessage.createdAtUtc);
  const currentDate = new Date(currentMessage.createdAtUtc);

  if (isSameDay(previousDate, currentDate)) return null;

  return format(currentDate, 'PPP');
};

export const TextChannelView = () => {
  const { t } = useTranslation();
  const { channelId, guildId } = useParams<{ channelId: string; guildId: string }>();
  const { onToggleMembers } = useOutletContext<MainLayoutOutletContext>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<SelectedMember | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
  const loadingMoreRef = useRef(false);

  const members = useGuildMembers(guildId);
  const membersMap = useMemo(() => new Map((members ?? []).map((m) => [m.userId, m])), [members]);
  const { channels } = useChannels();
  const { guilds, guildsLoading } = useGuilds();
  const { user } = useUser();
  const { banModal, canBanMember, openBanModal } = useMemberBanActions(guildId, () => {
    setSelected(null);
  });
  const currentChannel = channels?.find((c) => c.channelId === channelId);
  const { connection } = useRealtime();

  useEffect(() => {
    if (!channelId || channels === null || !currentChannel) return;
    setLoading(true);
    setError(false);
    setNextCursor(null);
    getChannelMessages(channelId)
      .then((data) => {
        setMessages(data.items);
        setNextCursor(data.nextCursor);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [channelId, channels, currentChannel]);

  useEffect(() => {
    if (!connection || !channelId || channels === null || !currentChannel) return;

    const handleMessageCreated = (event: MessageCreatedEvent) => {
      if (event.channelId !== channelId) return;
      setMessages((prev) => [
        ...prev,
        {
          messageId: event.messageId,
          authorUserId: event.authorUserId,
          content: event.content,
          createdAtUtc: event.createdAtUtc,
          updatedAtUtc: null,
        },
      ]);
    };

    const handleMessageDeleted = (event: MessageDeletedEvent) => {
      if (event.channelId !== channelId) return;
      setMessages((prev) => prev.filter((m) => m.messageId !== event.messageId));
    };

    connection.on('MessageCreated', handleMessageCreated);
    connection.on('MessageDeleted', handleMessageDeleted);

    return () => {
      connection.off('MessageCreated', handleMessageCreated);
      connection.off('MessageDeleted', handleMessageDeleted);
    };
  }, [connection, channelId, channels, currentChannel]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (scrollAnchorRef.current !== null) {
      // Restore scroll position: offset by the height added by prepended messages
      const { scrollTop, scrollHeight } = scrollAnchorRef.current;
      el.scrollTop = scrollTop + (el.scrollHeight - scrollHeight);
      scrollAnchorRef.current = null;
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const loadMore = useCallback(() => {
    if (!channelId || !nextCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    getChannelMessages(channelId, nextCursor)
      .then((data) => {
        // Capture scroll position just before prepending so the indicator height is excluded
        const el = scrollRef.current;
        if (el)
          scrollAnchorRef.current = { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight };
        setMessages((prev) => [...data.items, ...prev]);
        setNextCursor(data.nextCursor);
      })
      .catch(() => {})
      .finally(() => {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, [channelId, nextCursor]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollTop < 100) loadMore();
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      if (!channelId) return;
      setMessages((prev) => prev.filter((m) => m.messageId !== messageId));
      deleteMessage(channelId, messageId).catch(() => {});
    },
    [channelId]
  );

  if (!guildId || !channelId || guildsLoading || channels === null) {
    return null;
  }

  const guildExists = guilds.some((guild) => guild.guildId === guildId);

  if (!guildExists) {
    return <Navigate to="/" replace />;
  }

  if (!currentChannel) {
    return <Navigate to={`/guilds/${guildId}`} replace />;
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-text-3 text-sm bg-surface-1 border border-border-2 rounded-sm">
        {t('channel.messages.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-error-fg text-sm bg-surface-1 border border-border-2 rounded-sm">
        {t('channel.messages.error')}
      </div>
    );
  }

  const handleAvatarClick = (member: GuildMember, rect: DOMRect) => {
    setSelected((prev) => (prev?.member.userId === member.userId ? null : { member, rect }));
  };

  return (
    <>
      <div className="flex flex-col h-full bg-surface-1 border border-border-2 rounded-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-2 shrink-0 bg-surface-2 rounded-t-sm">
          <span className="text-sm font-semibold text-text-1">
            {currentChannel ? `# ${currentChannel.name}` : ''}
          </span>
          <IconButton size="small" onClick={onToggleMembers}>
            <Users size={16} />
          </IconButton>
        </div>
        {loadingMore && (
          <div className="flex justify-center py-1 text-text-3 text-xs shrink-0">
            {t('channel.messages.loading')}
          </div>
        )}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 gap-0">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-text-3 text-sm">
              {t('channel.messages.empty')}
            </div>
          ) : (
            messages.map((message, index) => {
              const prev = messages[index - 1];
              const grouped = areMessagesGrouped(prev, message);
              const daySeparatorLabel = getDaySeparatorLabel(prev, message);
              return (
                <div key={message.messageId}>
                  {daySeparatorLabel && <Separator label={daySeparatorLabel} />}
                  <MessageItem
                    message={message}
                    member={membersMap.get(message.authorUserId)}
                    grouped={grouped}
                    isOwn={message.authorUserId === user?.userId}
                    onAvatarClick={handleAvatarClick}
                    onDelete={handleDeleteMessage}
                  />
                </div>
              );
            })
          )}
        </div>
        <div className="px-4 pb-4">{channelId && <MessageInput channelId={channelId} />}</div>
      </div>
      {selected && (
        <MemberPopover
          member={selected.member}
          anchorRect={selected.rect}
          onClose={() => setSelected(null)}
          side="right"
          onBan={canBanMember(selected.member) ? () => openBanModal(selected.member) : undefined}
        />
      )}
      {banModal}
    </>
  );
};
