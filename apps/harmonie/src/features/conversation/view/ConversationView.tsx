import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, IconButton, Modal, Separator } from '@harmonie/ui';
import { Users } from 'lucide-react';
import { sendConversationMessage } from '@/api/conversations';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { useUser } from '@/features/user/UserContext';
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
import type { GuildMember } from '@/types/guild';
import { useConversation } from '../ConversationContext';
import { getConversationLabel, participantToMember } from '../conversationUtils';
import { useConversationMessages } from './hooks/useConversationMessages';
import { ConversationParticipantsPanel } from './ConversationParticipantsPanel';

export const ConversationView = () => {
  const { t } = useTranslation();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useUser();
  const { connection } = useRealtime();
  const conversation = useConversation(conversationId);

  const [messageMenu, setMessageMenu] = useState<MessageMenuState | null>(null);
  const [pendingDeleteMessageId, setPendingDeleteMessageId] = useState<string | null>(null);
  const [separatorDismissed, setSeparatorDismissed] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesContentRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
  const previousMessageCountRef = useRef(0);
  const suppressNextScrollEffectsRef = useRef(false);
  const shouldStickToBottomRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    requestAnimationFrame(() => {
      const next = scrollRef.current;
      if (!next) return;
      next.scrollTop = next.scrollHeight;
    });
  }, []);

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
    removeAttachment,
    toggleReaction,
    typingUserIds,
  } = useConversationMessages({
    conversationId,
    connection,
    currentUserId: user?.userId,
  });

  const membersMap = useMemo(() => {
    const map = new Map<string, GuildMember>();
    if (conversation?.participants) {
      for (const p of conversation.participants) {
        map.set(p.userId, participantToMember(p));
      }
    }
    return map;
  }, [conversation]);

  const conversationTitle = useMemo(() => {
    if (!conversation) return conversationId ?? '';
    return getConversationLabel(conversation, user?.userId);
  }, [conversation, conversationId, user?.userId]);

  useEffect(() => {
    setMessageMenu(null);
    setSeparatorDismissed(false);
    setMembersOpen(false);
    previousMessageCountRef.current = 0;
    scrollAnchorRef.current = null;
    suppressNextScrollEffectsRef.current = false;
    shouldStickToBottomRef.current = false;
  }, [conversationId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (scrollAnchorRef.current) {
      const { scrollTop, scrollHeight } = scrollAnchorRef.current;
      suppressNextScrollEffectsRef.current = true;
      el.scrollTop = scrollTop + (el.scrollHeight - scrollHeight);
      scrollAnchorRef.current = null;
      return;
    }

    const previousCount = previousMessageCountRef.current;
    const hasNew = messages.length > previousCount;
    const isInitial = previousCount === 0 && messages.length > 0;

    if (hasNew || isInitial) {
      suppressNextScrollEffectsRef.current = true;
      shouldStickToBottomRef.current = true;
      requestAnimationFrame(() => scrollToBottom());
    }

    previousMessageCountRef.current = messages.length;
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const contentEl = messagesContentRef.current;
    if (!contentEl) return;
    const observer = new ResizeObserver(() => {
      if (shouldStickToBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom());
      }
    });
    observer.observe(contentEl);
    return () => observer.disconnect();
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (!editingMessageId) return;
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const msgEl = el.querySelector<HTMLElement>(`[data-message-id="${editingMessageId}"]`);
      suppressNextScrollEffectsRef.current = true;
      msgEl?.scrollIntoView({ block: 'nearest' });
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
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = async () => {
      if (lastReadMessageId !== null && !separatorDismissed) {
        setSeparatorDismissed(true);
      }
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      shouldStickToBottomRef.current = distanceFromBottom < 50;
      if (el.scrollTop >= 100) return;
      scrollAnchorRef.current = { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight };
      await loadMore();
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [lastReadMessageId, loadMore, separatorDismissed]);

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

  if (!conversationId) return null;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-text-3 text-sm bg-surface-1 rounded-md">
        {t('conversation.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-error-fg text-sm bg-surface-1 rounded-md">
        {t('conversation.error')}
      </div>
    );
  }

  const isGroup = conversation?.type === 'Group';

  return (
    <>
      <div className="flex h-full gap-2">
        <div className="flex flex-col flex-1 min-w-0 h-full bg-surface-1 rounded-md overflow-hidden">
          <div className="flex items-center justify-between px-4 h-14 shrink-0 bg-surface-2 rounded-t-md">
            <span className="text-sm font-semibold text-text-1">{conversationTitle}</span>
            {isGroup && (
              <div className="flex items-center gap-2">
                <IconButton
                  size="small"
                  aria-label={t('conversation.participantsTitle')}
                  title={t('conversation.participantsTitle')}
                  onClick={() => setMembersOpen((o) => !o)}
                >
                  <Users size={16} />
                </IconButton>
              </div>
            )}
          </div>

          {loadingMore && (
            <div className="flex justify-center py-1 text-text-3 text-xs shrink-0">
              {t('conversation.loading')}
            </div>
          )}

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 gap-0">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-text-3 text-sm">
                {t('conversation.empty')}
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
                        onEdit={handleStartEditing}
                        onCancelEdit={cancelEditing}
                        onSaveEdit={saveEdit}
                        onDelete={handleDeleteRequest}
                        onAttachmentDeleted={(fileId) =>
                          removeAttachment(message.messageId, fileId)
                        }
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
              key={conversationId}
              sendFn={(content, fileIds) =>
                sendConversationMessage(conversationId, content, fileIds)
              }
              onTypingStart={() =>
                connection?.send('StartTypingConversation', conversationId).catch(() => {})
              }
              latestEditableMessage={latestOwnMessage}
              onEditingRequested={handleStartEditing}
            />
          </div>
        </div>

        {isGroup && membersOpen && conversation && (
          <ConversationParticipantsPanel
            participants={conversation.participants}
            onClose={() => setMembersOpen(false)}
          />
        )}
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
    </>
  );
};
