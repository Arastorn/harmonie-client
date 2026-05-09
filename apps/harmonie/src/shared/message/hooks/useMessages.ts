import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sortMessagesAsc } from '@/shared/utils/message';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
import type { Message, MessageList, MessagePreviewUpdatedEvent } from '@/types/channel';
import type { HubConnection } from '@microsoft/signalr';

interface WsMessageCreatedEvent {
  messageId: string;
  authorUserId: string;
  content: string;
  attachments: Message['attachments'];
  replyTo?: Message['replyTo'];
  linkPreviews?: Message['linkPreviews'];
  isPinned?: boolean;
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
  reactorUsername?: string;
  reactorDisplayName?: string | null;
  [key: string]: unknown;
}

interface WsMessagePinnedEvent {
  messageId: string;
  channelId?: string | null;
  conversationId?: string | null;
  pinnedByUserId: string;
  pinnedAtUtc: string;
  [key: string]: unknown;
}

interface WsMessageUnpinnedEvent {
  messageId: string;
  channelId?: string | null;
  conversationId?: string | null;
  unpinnedByUserId: string;
  unpinnedAtUtc: string;
  [key: string]: unknown;
}

export interface UseMessagesApi {
  fetchMessages: (entityId: string, cursor?: string) => Promise<MessageList>;
  ackMessage: (entityId: string, messageId: string) => Promise<void>;
  updateMessage: (entityId: string, messageId: string, content: string) => Promise<Message>;
  deleteMessage: (entityId: string, messageId: string) => Promise<void>;
  deleteAttachment: (entityId: string, messageId: string, attachmentId: string) => Promise<void>;
  pinMessage: (entityId: string, messageId: string) => Promise<void>;
  unpinMessage: (entityId: string, messageId: string) => Promise<void>;
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
    if (!entityId || !ready) {
      setMessages([]);
      setLoading(true);
      setError(false);
      setNextCursor(null);
      setLastReadMessageId(null);
      return;
    }

    let cancelled = false;

    setMessages([]);
    setLoading(true);
    setError(false);
    setNextCursor(null);
    setLastReadMessageId(null);

    apiRef.current
      .fetchMessages(entityId)
      .then((data) => {
        if (cancelled) return;
        const sorted = sortMessagesAsc(data.items);
        setMessages(sorted);
        setNextCursor(data.nextCursor);
        const lastMessage = sorted[sorted.length - 1];
        const hasUnread =
          data.lastReadMessageId !== null && data.lastReadMessageId !== lastMessage?.messageId;
        setLastReadMessageId(hasUnread ? data.lastReadMessageId : null);
        if (lastMessage) markAsRead(lastMessage.messageId).catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
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
          replyTo: event.replyTo ?? null,
          linkPreviews: event.linkPreviews ?? null,
          isPinned: event.isPinned ?? false,
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
      const reactor =
        event.reactorUsername || event.reactorDisplayName
          ? {
              userId: event.userId,
              username: event.reactorUsername ?? '',
              displayName: event.reactorDisplayName ?? null,
            }
          : null;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.messageId !== event.messageId) return m;
          const exists = m.reactions.some((r) => r.emoji === event.emoji);
          return {
            ...m,
            reactions: exists
              ? m.reactions.map((r) =>
                  r.emoji === event.emoji
                    ? {
                        ...r,
                        count: r.count + 1,
                        users: reactor
                          ? [
                              reactor,
                              ...(r.users ?? []).filter((user) => user.userId !== reactor.userId),
                            ].slice(0, 5)
                          : r.users,
                      }
                    : r
                )
              : [
                  ...m.reactions,
                  {
                    emoji: event.emoji,
                    count: 1,
                    reactedByMe: false,
                    users: reactor ? [reactor] : [],
                  },
                ],
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

    connection.on(REALTIME_SERVER_EVENTS.reactionAdded, handleReactionAdded);
    connection.on(REALTIME_SERVER_EVENTS.reactionRemoved, handleReactionRemoved);

    return () => {
      connection.off(REALTIME_SERVER_EVENTS.reactionAdded, handleReactionAdded);
      connection.off(REALTIME_SERVER_EVENTS.reactionRemoved, handleReactionRemoved);
    };
  }, [connection, entityId, ready, currentUserId]);

  useEffect(() => {
    if (!connection || !entityId || !ready) return;

    const handleMessagePreviewUpdated = (event: MessagePreviewUpdatedEvent) => {
      const eventEntityId = event[wsRef.current.entityIdField as keyof MessagePreviewUpdatedEvent];
      if (eventEntityId !== entityId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.messageId === event.messageId ? { ...m, linkPreviews: event.previews ?? [] } : m
        )
      );
    };

    connection.on(REALTIME_SERVER_EVENTS.messagePreviewUpdated, handleMessagePreviewUpdated);

    return () => {
      connection.off(REALTIME_SERVER_EVENTS.messagePreviewUpdated, handleMessagePreviewUpdated);
    };
  }, [connection, entityId, ready]);

  useEffect(() => {
    if (!connection || !entityId || !ready) return;

    const getEntityId = (event: WsMessagePinnedEvent | WsMessageUnpinnedEvent) =>
      wsRef.current.entityIdField === 'channelId' ? event.channelId : event.conversationId;

    const updatePinnedState = (messageId: string, isPinned: boolean) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.messageId === messageId ? { ...message, isPinned } : message
        )
      );
    };

    const handleMessagePinned = (event: WsMessagePinnedEvent) => {
      if (getEntityId(event) !== entityId) return;
      updatePinnedState(event.messageId, true);
    };

    const handleMessageUnpinned = (event: WsMessageUnpinnedEvent) => {
      if (getEntityId(event) !== entityId) return;
      updatePinnedState(event.messageId, false);
    };

    connection.on(REALTIME_SERVER_EVENTS.messagePinned, handleMessagePinned);
    connection.on(REALTIME_SERVER_EVENTS.messageUnpinned, handleMessageUnpinned);

    return () => {
      connection.off(REALTIME_SERVER_EVENTS.messagePinned, handleMessagePinned);
      connection.off(REALTIME_SERVER_EVENTS.messageUnpinned, handleMessageUnpinned);
    };
  }, [connection, entityId, ready]);

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

  const setMessagePinned = useCallback(
    async (messageId: string, isPinned: boolean) => {
      if (!entityId) return;
      const backup = messagesRef.current;
      setMessages((prev) => prev.map((m) => (m.messageId === messageId ? { ...m, isPinned } : m)));
      try {
        await (isPinned ? apiRef.current.pinMessage : apiRef.current.unpinMessage)(
          entityId,
          messageId
        );
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
          : [...reactions, { emoji, count: 1, reactedByMe: true, users: [] }]
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
    setMessagePinned,
    toggleReaction,
  };
};
