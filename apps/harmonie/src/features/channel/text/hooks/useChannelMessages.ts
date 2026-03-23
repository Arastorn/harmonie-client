import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deleteMessage, getChannelMessages, updateMessage } from '@/api/channels';
import { sortMessagesAsc } from '@/shared/utils/message';
import type {
  Message,
  MessageCreatedEvent,
  MessageDeletedEvent,
  MessageUpdatedEvent,
} from '@/types/channel';
import type { HubConnection } from '@microsoft/signalr';

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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    if (!channelId || !channelReady) return;

    setLoading(true);
    setError(false);
    setNextCursor(null);
    setEditingMessageId(null);

    getChannelMessages(channelId)
      .then((data) => {
        setMessages(sortMessagesAsc(data.items));
        setNextCursor(data.nextCursor);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [channelId, channelReady]);

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
          createdAtUtc: event.createdAtUtc,
          updatedAtUtc: null,
        },
      ]);
    };

    const handleMessageDeleted = (event: MessageDeletedEvent) => {
      if (event.channelId !== channelId) return;
      if (event.messageId === editingMessageId) {
        setEditingMessageId(null);
      }
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
  }, [channelId, channelReady, connection, editingMessageId]);

  const loadMore = useCallback(async () => {
    if (!channelId || !nextCursor || loadingMoreRef.current) return [];

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const data = await getChannelMessages(channelId, nextCursor);
      setMessages((prev) => {
        const existingIds = new Set(prev.map((message) => message.messageId));
        const newItems = sortMessagesAsc(data.items).filter(
          (message) => !existingIds.has(message.messageId)
        );
        return [...newItems, ...prev];
      });
      setNextCursor(data.nextCursor);
      return data.items;
    } catch {
      return [];
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [channelId, nextCursor]);

  const startEditing = useCallback((messageId: string) => {
    setEditingMessageId(messageId);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingMessageId(null);
  }, []);

  const saveEdit = useCallback(
    async (messageId: string, content: string) => {
      if (!channelId) return;
      const updatedMessage = await updateMessage(channelId, messageId, content);
      setMessages((prev) =>
        prev.map((message) =>
          message.messageId === updatedMessage.messageId
            ? { ...message, ...updatedMessage }
            : message
        )
      );
      setEditingMessageId(null);
    },
    [channelId]
  );

  const removeMessage = useCallback(
    (messageId: string) => {
      if (!channelId) return;
      if (editingMessageId === messageId) {
        setEditingMessageId(null);
      }
      setMessages((prev) => prev.filter((message) => message.messageId !== messageId));
      deleteMessage(channelId, messageId).catch(() => {});
    },
    [channelId, editingMessageId]
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
    latestOwnMessage,
    loadMore,
    startEditing,
    cancelEditing,
    saveEdit,
    removeMessage,
  };
};
