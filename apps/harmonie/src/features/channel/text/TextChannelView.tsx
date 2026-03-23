import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { IconButton, Separator } from '@harmonie/ui';
import type { GuildMember } from '@/types/guild';
import { useMemberBanActions } from '@/features/guild/hooks/useMemberBanActions';
import { useGuildMembers, useGuilds } from '@/features/guild/GuildContext';
import { useChannels } from '@/features/channel/ChannelContext';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { useUser } from '@/features/user/UserContext';
import { MemberPopover } from '@/shared/components/MemberPopover';
import type { MainLayoutOutletContext } from '@/layouts/MainLayout';
import { MessageComposer } from './components/MessageComposer';
import { MessageListItem } from './components/MessageListItem';
import { MessageContextMenu, type MessageMenuState } from './components/message/MessageContextMenu';
import { useChannelMessages } from './hooks/useChannelMessages';
import { areMessagesGrouped, getDaySeparatorLabel } from './utils/messagePresentation';

interface SelectedMember {
  member: GuildMember;
  rect: DOMRect;
}

export const TextChannelView = () => {
  const { t } = useTranslation();
  const { channelId, guildId } = useParams<{ channelId: string; guildId: string }>();
  const { onToggleMembers } = useOutletContext<MainLayoutOutletContext>();
  const [selected, setSelected] = useState<SelectedMember | null>(null);
  const [messageMenu, setMessageMenu] = useState<MessageMenuState | null>(null);
  const [separatorDismissed, setSeparatorDismissed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
  const previousMessageCountRef = useRef(0);
  const suppressNextScrollEffectsRef = useRef(false);

  const members = useGuildMembers(guildId);
  const membersMap = useMemo(
    () => new Map((members ?? []).map((member) => [member.userId, member])),
    [members]
  );
  const { channels } = useChannels();
  const { guilds, guildsLoading } = useGuilds();
  const { user } = useUser();
  const { connection } = useRealtime();
  const currentChannel = channels?.find((channel) => channel.channelId === channelId);
  const channelReady = Boolean(channelId && channels !== null && currentChannel);
  const { banModal, canBanMember, openBanModal } = useMemberBanActions(guildId, () => {
    setSelected(null);
  });

  const {
    messages,
    loading,
    error,
    loadingMore,
    editingMessageId,
    lastReadMessageId,
    latestOwnMessage,
    loadMore,
    startEditing,
    cancelEditing,
    dismissNewMessagesSeparator,
    saveEdit,
    removeMessage,
  } = useChannelMessages({
    channelId,
    channelReady,
    connection,
    currentUserId: user?.userId,
  });

  useEffect(() => {
    setMessageMenu(null);
    setSeparatorDismissed(false);
    previousMessageCountRef.current = 0;
  }, [channelId]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    if (scrollAnchorRef.current) {
      const { scrollTop, scrollHeight } = scrollAnchorRef.current;
      suppressNextScrollEffectsRef.current = true;
      element.scrollTop = scrollTop + (element.scrollHeight - scrollHeight);
      scrollAnchorRef.current = null;
      return;
    }

    const previousMessageCount = previousMessageCountRef.current;
    const hasNewMessages = messages.length > previousMessageCount;
    const isInitialLoad = previousMessageCount === 0 && messages.length > 0;

    if (isInitialLoad && lastReadMessageId) {
      requestAnimationFrame(() => {
        const lastReadElement = element.querySelector<HTMLElement>(
          `[data-message-id="${lastReadMessageId}"]`
        );

        if (!lastReadElement) {
          suppressNextScrollEffectsRef.current = true;
          element.scrollTop = element.scrollHeight;
          return;
        }

        suppressNextScrollEffectsRef.current = true;
        lastReadElement.scrollIntoView({ block: 'center' });
      });
    } else if (hasNewMessages || isInitialLoad) {
      suppressNextScrollEffectsRef.current = true;
      element.scrollTop = element.scrollHeight;
    }

    previousMessageCountRef.current = messages.length;
  }, [lastReadMessageId, messages]);

  useEffect(() => {
    if (!editingMessageId) return;

    const element = scrollRef.current;
    if (!element) return;

    requestAnimationFrame(() => {
      const messageElement = element.querySelector<HTMLElement>(
        `[data-message-id="${editingMessageId}"]`
      );
      suppressNextScrollEffectsRef.current = true;
      messageElement?.scrollIntoView({ block: 'nearest' });
    });
  }, [editingMessageId]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = async () => {
      if (suppressNextScrollEffectsRef.current) {
        suppressNextScrollEffectsRef.current = false;
        return;
      }

      if (lastReadMessageId !== null && !separatorDismissed) {
        setSeparatorDismissed(true);
      }
      if (element.scrollTop >= 100) return;
      scrollAnchorRef.current = {
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
      };
      await loadMore();
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [dismissNewMessagesSeparator, lastReadMessageId, loadMore, separatorDismissed]);

  const handleAvatarClick = (member: GuildMember, rect: DOMRect) => {
    setSelected((prev) => (prev?.member.userId === member.userId ? null : { member, rect }));
  };

  const handleOpenMessageMenu = (
    event: React.MouseEvent<HTMLElement>,
    messageId: string,
    horizontalAnchor: 'left' | 'right' = 'left'
  ) => {
    event.preventDefault();
    setMessageMenu({
      messageId,
      position: { x: event.clientX, y: event.clientY },
      horizontalAnchor,
    });
  };

  const handleStartEditing = (messageId: string) => {
    setMessageMenu(null);
    startEditing(messageId);
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessageMenu(null);
    removeMessage(messageId);
  };

  if (!guildId || !channelId || guildsLoading || channels === null) {
    return null;
  }

  if (!guilds.some((guild) => guild.guildId === guildId)) {
    return <Navigate to="/" replace />;
  }

  if (!currentChannel) {
    return <Navigate to={`/guilds/${guildId}`} replace />;
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-text-3 text-sm bg-surface-1 rounded-md">
        {t('channel.messages.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-error-fg text-sm bg-surface-1 rounded-md">
        {t('channel.messages.error')}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-surface-1 rounded-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-surface-2 rounded-t-md">
          <span className="text-sm font-semibold text-text-1"># {currentChannel.name}</span>
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
              const previousMessage = messages[index - 1];
              const daySeparatorLabel = getDaySeparatorLabel(previousMessage, message);
              const grouped = daySeparatorLabel
                ? false
                : areMessagesGrouped(previousMessage, message);
              const isFirstUnread =
                lastReadMessageId !== null && previousMessage?.messageId === lastReadMessageId;

              return (
                <div key={message.messageId}>
                  {daySeparatorLabel && <Separator label={daySeparatorLabel} />}
                  {isFirstUnread && (
                    <div
                      className={`transition-opacity duration-500 ${separatorDismissed ? 'opacity-0' : 'opacity-100'}`}
                      onTransitionEnd={() => {
                        if (separatorDismissed) dismissNewMessagesSeparator();
                      }}
                    >
                      <Separator label={t('channel.messages.newMessages')} variant="accent" />
                    </div>
                  )}
                  <MessageListItem
                    message={message}
                    member={membersMap.get(message.authorUserId)}
                    grouped={grouped}
                    isOwn={message.authorUserId === user?.userId}
                    isEditing={message.messageId === editingMessageId}
                    isMenuOpen={message.messageId === messageMenu?.messageId}
                    onAvatarClick={handleAvatarClick}
                    onEdit={handleStartEditing}
                    onCancelEdit={cancelEditing}
                    onSaveEdit={saveEdit}
                    onDelete={handleDeleteMessage}
                    onOpenMenu={handleOpenMessageMenu}
                  />
                </div>
              );
            })
          )}
        </div>

        <div className="mt-auto flex items-end px-4 pb-4">
          <MessageComposer
            channelId={channelId}
            latestEditableMessage={latestOwnMessage}
            onEditingRequested={handleStartEditing}
          />
        </div>
      </div>

      <MessageContextMenu
        menu={messageMenu}
        onClose={() => setMessageMenu(null)}
        onEdit={handleStartEditing}
        onDelete={handleDeleteMessage}
      />

      {selected && (
        <MemberPopover
          member={selected.member}
          anchorRect={selected.rect}
          onClose={() => setSelected(null)}
          side="right"
          onBan={canBanMember(selected.member) ? () => openBanModal(selected.member) : undefined}
          isOwner={
            guilds.find((guild) => guild.guildId === guildId)?.ownerUserId ===
            selected.member.userId
          }
        />
      )}

      {banModal}
    </>
  );
};
