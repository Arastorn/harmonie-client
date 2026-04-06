import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ackChannel, deleteAttachment, deleteMessage, getChannelMessages } from '@/api/channels';
import { sortMessagesAsc } from '@/shared/utils/message';
import type {
  Message,
  MessageCreatedEvent,
  MessageDeletedEvent,
  MessageUpdatedEvent,
} from '@/types/channel';
import type { HubConnection } from '@microsoft/signalr';
import { useChannelTyping } from './useChannelTyping';
import { useMessageEditing } from './useMessageEditing';
import { useMessageReactions } from './useMessageReactions';

interface UseChannelMessagesParams {
  channelId?: string;
  channelReady: boolean;
  connection: HubConnection | null;
  currentUserId?: string;
}

export const useChannelMessages = ({
  channelId,
  channelReady,
  connection,
  currentUserId,
}: UseChannelMessagesParams) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);
  const nextCursorRef = useRef<string | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  const { editingMessageId, editingMessageIdRef, startEditing, cancelEditing, saveEdit } =
    useMessageEditing({ channelId, setMessages });

  const { toggleReaction } = useMessageReactions({
    channelId,
    channelReady,
    connection,
    currentUserId,
    messagesRef,
    setMessages,
  });

  const { typingUserIds } = useChannelTyping({
    channelId,
    channelReady,
    connection,
    currentUserId,
  });

  const markChannelAsRead = useCallback(
    async (messageId: string) => {
      if (!channelId) return;
      await ackChannel(channelId, messageId);
    },
    [channelId]
  );

  const dismissNewMessagesSeparator = useCallback(() => {
    setLastReadMessageId(null);
  }, []);

  useEffect(() => {
    if (!channelId || !channelReady) return;

    setLoading(true);
    setError(false);
    setNextCursor(null);
    setLastReadMessageId(null);

    getChannelMessages(channelId)
      .then((data) => {
        const sorted = sortMessagesAsc(data.items);
        setMessages(sorted);
        setNextCursor(data.nextCursor);
        const lastMessage = sorted[sorted.length - 1];
        const hasUnread =
          data.lastReadMessageId !== null && data.lastReadMessageId !== lastMessage?.messageId;
        setLastReadMessageId(hasUnread ? data.lastReadMessageId : null);
        if (lastMessage) {
          markChannelAsRead(lastMessage.messageId).catch(() => {});
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [channelId, channelReady, markChannelAsRead]);

  useEffect(() => {
    if (!connection || !channelId || !channelReady) return;

    const handleMessageCreated = (event: MessageCreatedEvent) => {
      if (event.channelId !== channelId) return;
      setMessages((prev) => [
        ...prev,
        {
          messageId: event.messageId,
          authorUserId: event.authorUserId,
          content: event.content,
          attachments: event.attachments ?? [],
          reactions: [],
          createdAtUtc: event.createdAtUtc,
          updatedAtUtc: null,
        },
      ]);
      markChannelAsRead(event.messageId).catch(() => {});
    };

    const handleMessageDeleted = (event: MessageDeletedEvent) => {
      if (event.channelId !== channelId) return;
      if (event.messageId === editingMessageIdRef.current) cancelEditing();
      setMessages((prev) => prev.filter((message) => message.messageId !== event.messageId));
    };

    const handleMessageUpdated = (event: MessageUpdatedEvent) => {
      if (event.channelId !== channelId) return;
      setMessages((prev) =>
        prev.map((message) =>
          message.messageId === event.messageId
            ? { ...message, content: event.content, updatedAtUtc: event.updatedAtUtc }
            : message
        )
      );
    };

    connection.on('MessageCreated', handleMessageCreated);
    connection.on('MessageDeleted', handleMessageDeleted);
    connection.on('MessageUpdated', handleMessageUpdated);

    return () => {
      connection.off('MessageCreated', handleMessageCreated);
      connection.off('MessageDeleted', handleMessageDeleted);
      connection.off('MessageUpdated', handleMessageUpdated);
    };
  }, [cancelEditing, channelId, channelReady, connection, editingMessageIdRef, markChannelAsRead]);

  const loadMoreWithCursor = useCallback(
    async (cursor: string) => {
      if (!channelId || loadingMoreRef.current) return [];

      loadingMoreRef.current = true;
      setLoadingMore(true);

      try {
        const data = await getChannelMessages(channelId, cursor);
        setMessages((prev) => {
          const existingIds = new Set(prev.map((message) => message.messageId));
          const newItems = sortMessagesAsc(data.items).filter(
            (message) => !existingIds.has(message.messageId)
          );
          return [...newItems, ...prev];
        });
        nextCursorRef.current = data.nextCursor;
        setNextCursor(data.nextCursor);
        return data.items;
      } catch {
        return [];
      } finally {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    },
    [channelId]
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor) return [];
    return loadMoreWithCursor(nextCursor);
  }, [loadMoreWithCursor, nextCursor]);

  const loadUntilMessage = useCallback(
    async (messageId: string) => {
      if (!channelId) return false;
      if (messagesRef.current.some((message) => message.messageId === messageId)) return true;

      while (nextCursorRef.current && !loadingMoreRef.current) {
        const cursor = nextCursorRef.current;
        if (!cursor) break;

        const items = await loadMoreWithCursor(cursor);
        if (items.some((message) => message.messageId === messageId)) {
          return true;
        }
        if (items.length === 0) {
          break;
        }
      }

      return messagesRef.current.some((message) => message.messageId === messageId);
    },
    [channelId, loadMoreWithCursor]
  );

  const removeMessage = useCallback(
    (messageId: string) => {
      if (!channelId) return;
      if (messageId === editingMessageIdRef.current) cancelEditing();
      setMessages((prev) => prev.filter((message) => message.messageId !== messageId));
      deleteMessage(channelId, messageId).catch(() => {});
    },
    [cancelEditing, channelId, editingMessageIdRef]
  );

  const removeAttachment = useCallback(
    (messageId: string, attachmentFileId: string) => {
      if (!channelId) return;
      setMessages((prev) =>
        prev.map((message) =>
          message.messageId === messageId
            ? {
                ...message,
                attachments: message.attachments.filter((a) => a.fileId !== attachmentFileId),
              }
            : message
        )
      );
      deleteAttachment(channelId, messageId, attachmentFileId).catch(() => {});
    },
    [channelId]
  );

  const latestOwnMessage = useMemo(
    () => [...messages].reverse().find((message) => message.authorUserId === currentUserId) ?? null,
    [currentUserId, messages]
  );

  return {
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
  };
};
