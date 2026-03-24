import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ackChannel,
  addReaction,
  deleteMessage,
  getChannelMessages,
  removeReaction,
  updateMessage,
} from '@/api/channels';
import { sortMessagesAsc } from '@/shared/utils/message';
import type {
  Message,
  MessageCreatedEvent,
  MessageDeletedEvent,
  MessageUpdatedEvent,
  ReactionAddedEvent,
  ReactionRemovedEvent,
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
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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
    setEditingMessageId(null);
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

    const handleReactionAdded = (event: ReactionAddedEvent) => {
      if (event.channelId !== channelId || event.userId === currentUserId) return;
      setMessages((prev) =>
        prev.map((message) => {
          if (message.messageId !== event.messageId) return message;
          const exists = message.reactions.some((r) => r.emoji === event.emoji);
          return {
            ...message,
            reactions: exists
              ? message.reactions.map((r) =>
                  r.emoji === event.emoji ? { ...r, count: r.count + 1 } : r
                )
              : [...message.reactions, { emoji: event.emoji, count: 1, reactedByMe: false }],
          };
        })
      );
    };

    const handleReactionRemoved = (event: ReactionRemovedEvent) => {
      if (event.channelId !== channelId || event.userId === currentUserId) return;
      setMessages((prev) =>
        prev.map((message) =>
          message.messageId !== event.messageId
            ? message
            : {
                ...message,
                reactions: message.reactions
                  .map((r) => (r.emoji === event.emoji ? { ...r, count: r.count - 1 } : r))
                  .filter((r) => r.count > 0),
              }
        )
      );
    };

    connection.on('MessageCreated', handleMessageCreated);
    connection.on('MessageDeleted', handleMessageDeleted);
    connection.on('MessageUpdated', handleMessageUpdated);
    connection.on('ReactionAdded', handleReactionAdded);
    connection.on('ReactionRemoved', handleReactionRemoved);

    return () => {
      connection.off('MessageCreated', handleMessageCreated);
      connection.off('MessageDeleted', handleMessageDeleted);
      connection.off('MessageUpdated', handleMessageUpdated);
      connection.off('ReactionAdded', handleReactionAdded);
      connection.off('ReactionRemoved', handleReactionRemoved);
    };
  }, [channelId, channelReady, connection, currentUserId, editingMessageId, markChannelAsRead]);

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

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!channelId) return;
      const message = messagesRef.current.find((m) => m.messageId === messageId);
      if (!message) return;

      const { reactions } = message;
      const existing = reactions.find((r) => r.emoji === emoji);
      const isReacting = !existing?.reactedByMe;
      const originalReactions = reactions;

      const nextReactions = isReacting
        ? existing
          ? reactions.map((reaction) =>
              reaction.emoji === emoji
                ? { ...reaction, count: reaction.count + 1, reactedByMe: true }
                : reaction
            )
          : [...reactions, { emoji, count: 1, reactedByMe: true }]
        : reactions
            .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, reactedByMe: false } : r))
            .filter((r) => r.count > 0);

      setMessages((prev) =>
        prev.map((message) =>
          message.messageId === messageId ? { ...message, reactions: nextReactions } : message
        )
      );

      try {
        await (isReacting ? addReaction : removeReaction)(channelId, messageId, emoji);
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.messageId === messageId ? { ...m, reactions: originalReactions } : m))
        );
      }
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
    loadMore,
    startEditing,
    cancelEditing,
    dismissNewMessagesSeparator,
    saveEdit,
    removeMessage,
    toggleReaction,
  };
};
