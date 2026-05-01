import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { Button, IconButton, Modal, Separator } from '@harmonie/ui';
import { GuildSearchBar } from '@/features/guild/search/GuildSearchBar';
import type { GuildMember } from '@/types/guild';
import { useCurrentGuild, useGuildMembers } from '@/features/guild/GuildContext';
import { useChannels } from '@/features/channel/ChannelContext';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { useUser } from '@/features/user/UserContext';
import { MemberPopover } from '@/shared/members/MemberPopover';
import { useGuildWorkspace } from '@/features/guild/workspace/GuildWorkspaceProvider';
import { MessageComposer } from '@/shared/message/MessageComposer';
import { MessageListItem } from '@/shared/message/MessageListItem/MessageListItem';
import {
  MessageContextMenu,
  type MessageMenuState,
} from '@/shared/message/MessageListItem/MessageContextMenu';
import {
  areMessagesGrouped,
  getDaySeparatorLabel,
} from '@/shared/message/utils/messagePresentation';
import { sendMessage } from '@/api/channels';
import { useChannelMessages } from './hooks/useChannelMessages';
import { useTextChannelSearchTarget } from './hooks/useTextChannelSearchTarget';

interface SelectedMember {
  member: GuildMember;
  rect: DOMRect;
}

export const TextChannelView = () => {
  const { t } = useTranslation();
  const { channelId, guildId } = useParams<{ channelId: string; guildId: string }>();
  const {
    toggleMembersPanel,
    searchQuery,
    searchAuthorId,
    searchChannelId,
    setSearchQuery,
    setSearchAuthorId,
    setSearchChannelId,
  } = useGuildWorkspace();
  const [selected, setSelected] = useState<SelectedMember | null>(null);
  const [messageMenu, setMessageMenu] = useState<MessageMenuState | null>(null);
  const [pendingDeleteMessageId, setPendingDeleteMessageId] = useState<string | null>(null);
  const [separatorDismissed, setSeparatorDismissed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesContentRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
  const previousMessageCountRef = useRef(0);
  const suppressNextScrollEffectsRef = useRef(false);
  const shouldStickToBottomRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    scrollElement.scrollTop = scrollElement.scrollHeight;

    requestAnimationFrame(() => {
      const nextScrollElement = scrollRef.current;
      if (!nextScrollElement) return;
      nextScrollElement.scrollTop = nextScrollElement.scrollHeight;
    });
  }, []);

  const members = useGuildMembers(guildId);
  const membersMap = useMemo(
    () => new Map((members ?? []).map((member) => [member.userId, member])),
    [members]
  );
  const { channels } = useChannels();
  const { guildsLoading, guild } = useCurrentGuild();
  const { user } = useUser();
  const { connection } = useRealtime();
  const currentChannel = channels?.find((channel) => channel.channelId === channelId);
  const channelReady = Boolean(channelId && channels !== null && currentChannel);

  const {
    messages,
    loading,
    error,
    loadingMore,
    editingMessageId,
    lastReadMessageId,
    latestOwnMessage,
    typingUserIds,
    loadMore,
    loadUntilMessage,
    startEditing,
    cancelEditing,
    dismissNewMessagesSeparator,
    saveEdit,
    removeMessage,
    removeAttachment,
    toggleReaction,
  } = useChannelMessages({
    channelId,
    channelReady,
    connection,
    currentUserId: user?.userId,
  });

  const { activeSearchTarget, selectedMessageId, seekingTargetRef } = useTextChannelSearchTarget({
    channelId,
    guildId,
    messages,
    loading,
    error,
    scrollRef,
    previousMessageCountRef,
    suppressNextScrollEffectsRef,
    loadUntilMessage,
  });

  useEffect(() => {
    setMessageMenu(null);
    setSeparatorDismissed(false);
    previousMessageCountRef.current = 0;
    scrollAnchorRef.current = null;
    suppressNextScrollEffectsRef.current = false;
    shouldStickToBottomRef.current = false;
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

    if (activeSearchTarget || seekingTargetRef.current) {
      previousMessageCountRef.current = messages.length;
      return;
    }

    const previousMessageCount = previousMessageCountRef.current;
    const hasNewMessages = messages.length > previousMessageCount;
    const isInitialLoad = previousMessageCount === 0 && messages.length > 0;

    if (hasNewMessages || isInitialLoad) {
      suppressNextScrollEffectsRef.current = true;
      shouldStickToBottomRef.current = true;
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }

    previousMessageCountRef.current = messages.length;
  }, [activeSearchTarget, messages, scrollToBottom, seekingTargetRef]);

  useEffect(() => {
    const contentEl = messagesContentRef.current;
    if (!contentEl) return;

    const observer = new ResizeObserver(() => {
      if (shouldStickToBottomRef.current) {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }
    });

    observer.observe(contentEl);
    return () => observer.disconnect();
  }, [messages.length, scrollToBottom]);

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
    if (lastReadMessageId === null || separatorDismissed) return;
    const el = scrollRef.current;
    if (!el) return;
    const rafId = requestAnimationFrame(() => {
      if (el.scrollHeight <= el.clientHeight) setSeparatorDismissed(true);
    });
    return () => cancelAnimationFrame(rafId);
  }, [lastReadMessageId, separatorDismissed]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = async () => {
      if (lastReadMessageId !== null && !separatorDismissed) {
        setSeparatorDismissed(true);
      }
      const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
      shouldStickToBottomRef.current = distanceFromBottom < 50;
      if (element.scrollTop >= 100) return;
      scrollAnchorRef.current = {
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
      };
      await loadMore();
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [lastReadMessageId, loadMore, separatorDismissed]);

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

  const handleDeleteRequest = (messageId: string) => {
    setMessageMenu(null);
    setPendingDeleteMessageId(messageId);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteMessageId) removeMessage(pendingDeleteMessageId);
    setPendingDeleteMessageId(null);
  };

  if (!guildId || !channelId || guildsLoading || channels === null) {
    return null;
  }

  if (!guild) {
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
        <div className="flex items-center justify-between px-4 h-14 shrink-0 bg-surface-2 rounded-t-md">
          <span className="text-sm font-semibold text-text-1"># {currentChannel.name}</span>
          <div className="flex items-center gap-2">
            <GuildSearchBar
              query={searchQuery}
              authorId={searchAuthorId}
              channelId={searchChannelId}
              onQueryChange={setSearchQuery}
              onAuthorChange={setSearchAuthorId}
              onChannelChange={setSearchChannelId}
            />
            <IconButton size="small" onClick={toggleMembersPanel}>
              <Users size={16} />
            </IconButton>
          </div>
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
            <div ref={messagesContentRef}>
              {messages.map((message, index) => {
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
                      isSelected={message.messageId === selectedMessageId}
                      onAvatarClick={handleAvatarClick}
                      onEdit={handleStartEditing}
                      onCancelEdit={cancelEditing}
                      onSaveEdit={saveEdit}
                      onDelete={handleDeleteRequest}
                      onAttachmentDeleted={(fileId) => removeAttachment(message.messageId, fileId)}
                      onReact={toggleReaction}
                      onOpenMenu={handleOpenMessageMenu}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {typingUserIds.length > 0 && (
          <div className="px-4 py-1 text-xs text-text-3 shrink-0 h-6">
            {(() => {
              const names = typingUserIds.map(
                (id) => membersMap.get(id)?.displayName ?? membersMap.get(id)?.username ?? id
              );
              if (names.length === 1) return t('channel.typing.one', { name: names[0] });
              if (names.length === 2)
                return t('channel.typing.two', { name1: names[0], name2: names[1] });
              return t('channel.typing.several');
            })()}
          </div>
        )}

        <div className="mt-auto flex items-end px-4 pb-4">
          <MessageComposer
            key={channelId}
            sendFn={(content, fileIds) => sendMessage(channelId!, content, fileIds)}
            onTypingStart={() => connection?.send('StartTypingChannel', channelId).catch(() => {})}
            latestEditableMessage={latestOwnMessage}
            onEditingRequested={handleStartEditing}
          />
        </div>
      </div>

      <MessageContextMenu
        menu={messageMenu}
        onClose={() => setMessageMenu(null)}
        onEdit={handleStartEditing}
        onDelete={handleDeleteRequest}
      />

      {pendingDeleteMessageId && (
        <Modal title={t('channel.messages.delete')} onClose={() => setPendingDeleteMessageId(null)}>
          <p className="font-body text-sm text-text-2">{t('channel.messages.deleteConfirm')}</p>
          <div className="flex justify-end gap-2">
            <Button variant="tertiary" onClick={() => setPendingDeleteMessageId(null)}>
              {t('channel.messages.deleteCancel')}
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              {t('channel.messages.deleteConfirmButton')}
            </Button>
          </div>
        </Modal>
      )}

      {selected && guildId && (
        <MemberPopover
          member={selected.member}
          guildId={guildId}
          anchorRect={selected.rect}
          onClose={() => setSelected(null)}
          side="right"
          onRemoved={() => setSelected(null)}
          onBanned={() => setSelected(null)}
        />
      )}
    </>
  );
};
