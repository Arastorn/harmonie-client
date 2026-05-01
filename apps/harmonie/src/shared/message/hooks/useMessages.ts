import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sortMessagesAsc } from '@/shared/utils/message';
import type { Message, MessageList } from '@/types/channel';
import type { HubConnection } from '@microsoft/signalr';

interface WsMessageCreatedEvent {
  messageId: string;
  authorUserId: string;
  content: string;
  attachments: Message['attachments'];
  createdAtUtc: string;
  [key: string]: unknown;
}

interface WsMessageUpdatedEvent {
  messageId: string;
  content: string;
  updatedAtUtc: string;
  [key: string]: unknown;
}

interface WsMessageDeletedEvent {
  messageId: string;
  [key: string]: unknown;
}

interface WsReactionEvent {
  messageId: string;
  emoji: string;
  userId: string;
  [key: string]: unknown;
}

export interface UseMessagesApi {
  fetchMessages: (entityId: string, cursor?: string) => Promise<MessageList>;
  ackMessage: (entityId: string, messageId: string) => Promise<void>;
  updateMessage: (entityId: string, messageId: string, content: string) => Promise<Message>;
  deleteMessage: (entityId: string, messageId: string) => Promise<void>;
  deleteAttachment: (entityId: string, messageId: string, attachmentId: string) => Promise<void>;
  addReaction: (entityId: string, messageId: string, emoji: string) => Promise<void>;
  removeReaction: (entityId: string, messageId: string, emoji: string) => Promise<void>;
}

export interface UseMessagesWsConfig {
  created: string;
  updated: string;
  deleted: string;
  entityIdField: string;
}

export interface UseMessagesParams {
  entityId?: string;
  ready?: boolean;
  connection: HubConnection | null;
  currentUserId?: string;
  api: UseMessagesApi;
  ws: UseMessagesWsConfig;
  typingUserIds: string[];
}

export const useMessages = ({
  entityId,
  ready = true,
  connection,
  currentUserId,
  api,
  ws,
  typingUserIds,
}: UseMessagesParams) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const loadingMoreRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);
  const nextCursorRef = useRef<string | null>(null);
  const editingMessageIdRef = useRef<string | null>(null);

  const apiRef = useRef(api);
  apiRef.current = api;
  const wsRef = useRef(ws);
  wsRef.current = ws;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);
  useEffect(() => {
    editingMessageIdRef.current = editingMessageId;
  }, [editingMessageId]);
  useEffect(() => {
    setEditingMessageId(null);
  }, [entityId]);

  const markAsRead = useCallback(
    async (messageId: string) => {
      if (!entityId) return;
      await apiRef.current.ackMessage(entityId, messageId);
    },
    [entityId]
  );

  const dismissNewMessagesSeparator = useCallback(() => setLastReadMessageId(null), []);

  useEffect(() => {
    if (!entityId || !ready) return;

    setLoading(true);
    setError(false);
    setNextCursor(null);
    setLastReadMessageId(null);

    apiRef.current
      .fetchMessages(entityId)
      .then((data) => {
        const sorted = sortMessagesAsc(data.items);
        setMessages(sorted);
        setNextCursor(data.nextCursor);
        const lastMessage = sorted[sorted.length - 1];
        const hasUnread =
          data.lastReadMessageId !== null && data.lastReadMessageId !== lastMessage?.messageId;
        setLastReadMessageId(hasUnread ? data.lastReadMessageId : null);
        if (lastMessage) markAsRead(lastMessage.messageId).catch(() => {});
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [entityId, ready, markAsRead]);

  useEffect(() => {
    if (!connection || !entityId || !ready) return;

    const getEntityId = (event: Record<string, string>) => event[wsRef.current.entityIdField];

    const handleCreated = (event: WsMessageCreatedEvent) => {
      if (getEntityId(event as Record<string, string>) !== entityId) return;
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
      markAsRead(event.messageId).catch(() => {});
    };

    const handleUpdated = (event: WsMessageUpdatedEvent) => {
      if (getEntityId(event as Record<string, string>) !== entityId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.messageId === event.messageId
            ? { ...m, content: event.content, updatedAtUtc: event.updatedAtUtc }
            : m
        )
      );
    };

    const handleDeleted = (event: WsMessageDeletedEvent) => {
      if (getEntityId(event as Record<string, string>) !== entityId) return;
      if (event.messageId === editingMessageIdRef.current) setEditingMessageId(null);
      setMessages((prev) => prev.filter((m) => m.messageId !== event.messageId));
    };

    const { created, updated, deleted } = wsRef.current;
    connection.on(created, handleCreated);
    connection.on(updated, handleUpdated);
    connection.on(deleted, handleDeleted);

    return () => {
      connection.off(created, handleCreated);
      connection.off(updated, handleUpdated);
      connection.off(deleted, handleDeleted);
    };
  }, [connection, entityId, ready, markAsRead]);

  useEffect(() => {
    if (!connection || !entityId || !ready) return;

    const getEntityId = (event: Record<string, string>) => event[wsRef.current.entityIdField];

    const handleReactionAdded = (event: WsReactionEvent) => {
      if (getEntityId(event as Record<string, string>) !== entityId) return;
      if (event.userId === currentUserId) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.messageId !== event.messageId) return m;
          const exists = m.reactions.some((r) => r.emoji === event.emoji);
          return {
            ...m,
            reactions: exists
              ? m.reactions.map((r) => (r.emoji === event.emoji ? { ...r, count: r.count + 1 } : r))
              : [...m.reactions, { emoji: event.emoji, count: 1, reactedByMe: false }],
          };
        })
      );
    };

    const handleReactionRemoved = (event: WsReactionEvent) => {
      if (getEntityId(event as Record<string, string>) !== entityId) return;
      if (event.userId === currentUserId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.messageId !== event.messageId
            ? m
            : {
                ...m,
                reactions: m.reactions
                  .map((r) => (r.emoji === event.emoji ? { ...r, count: r.count - 1 } : r))
                  .filter((r) => r.count > 0),
              }
        )
      );
    };

    connection.on('ReactionAdded', handleReactionAdded);
    connection.on('ReactionRemoved', handleReactionRemoved);

    return () => {
      connection.off('ReactionAdded', handleReactionAdded);
      connection.off('ReactionRemoved', handleReactionRemoved);
    };
  }, [connection, entityId, ready, currentUserId]);

  const loadMoreWithCursor = useCallback(
    async (cursor: string) => {
      if (!entityId || loadingMoreRef.current) return [];
      loadingMoreRef.current = true;
      setLoadingMore(true);
      try {
        const data = await apiRef.current.fetchMessages(entityId, cursor);
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.messageId));
          const newItems = sortMessagesAsc(data.items).filter((m) => !existingIds.has(m.messageId));
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
    [entityId]
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor) return [];
    return loadMoreWithCursor(nextCursor);
  }, [loadMoreWithCursor, nextCursor]);

  const loadUntilMessage = useCallback(
    async (messageId: string) => {
      if (!entityId) return false;
      if (messagesRef.current.some((m) => m.messageId === messageId)) return true;
      while (nextCursorRef.current && !loadingMoreRef.current) {
        const cursor = nextCursorRef.current;
        if (!cursor) break;
        const items = await loadMoreWithCursor(cursor);
        if (items.some((m) => m.messageId === messageId)) return true;
        if (items.length === 0) break;
      }
      return messagesRef.current.some((m) => m.messageId === messageId);
    },
    [entityId, loadMoreWithCursor]
  );

  const startEditing = useCallback((messageId: string) => setEditingMessageId(messageId), []);
  const cancelEditing = useCallback(() => setEditingMessageId(null), []);

  const saveEdit = useCallback(
    async (messageId: string, content: string) => {
      if (!entityId) return;
      const updated = await apiRef.current.updateMessage(entityId, messageId, content);
      setMessages((prev) =>
        prev.map((m) => (m.messageId === updated.messageId ? { ...m, ...updated } : m))
      );
      setEditingMessageId(null);
    },
    [entityId]
  );

  const removeMessage = useCallback(
    async (messageId: string) => {
      if (!entityId) return;
      const backup = messagesRef.current;
      if (messageId === editingMessageIdRef.current) cancelEditing();
      setMessages((prev) => prev.filter((m) => m.messageId !== messageId));
      try {
        await apiRef.current.deleteMessage(entityId, messageId);
      } catch {
        setMessages(backup);
      }
    },
    [entityId, cancelEditing]
  );

  const removeAttachment = useCallback(
    async (messageId: string, attachmentFileId: string) => {
      if (!entityId) return;
      const backup = messagesRef.current;
      setMessages((prev) =>
        prev.map((m) =>
          m.messageId === messageId
            ? { ...m, attachments: m.attachments.filter((a) => a.fileId !== attachmentFileId) }
            : m
        )
      );
      try {
        await apiRef.current.deleteAttachment(entityId, messageId, attachmentFileId);
      } catch {
        setMessages(backup);
      }
    },
    [entityId]
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!entityId) return;
      const message = messagesRef.current.find((m) => m.messageId === messageId);
      if (!message) return;

      const { reactions } = message;
      const existing = reactions.find((r) => r.emoji === emoji);
      const isReacting = !existing?.reactedByMe;
      const originalReactions = reactions;

      const nextReactions = isReacting
        ? existing
          ? reactions.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count + 1, reactedByMe: true } : r
            )
          : [...reactions, { emoji, count: 1, reactedByMe: true }]
        : reactions
            .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, reactedByMe: false } : r))
            .filter((r) => r.count > 0);

      setMessages((prev) =>
        prev.map((m) => (m.messageId === messageId ? { ...m, reactions: nextReactions } : m))
      );

      try {
        await (isReacting ? apiRef.current.addReaction : apiRef.current.removeReaction)(
          entityId,
          messageId,
          emoji
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.messageId === messageId ? { ...m, reactions: originalReactions } : m))
        );
      }
    },
    [entityId]
  );

  const latestOwnMessage = useMemo(
    () => [...messages].reverse().find((m) => m.authorUserId === currentUserId) ?? null,
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
