import { useCallback, useEffect } from 'react';
import { addReaction, removeReaction } from '@/api/channels';
import type { Message, ReactionAddedEvent, ReactionRemovedEvent } from '@/types/channel';
import type { HubConnection } from '@microsoft/signalr';

interface UseMessageReactionsParams {
  channelId?: string;
  channelReady: boolean;
  connection: HubConnection | null;
  currentUserId?: string;
  messagesRef: React.MutableRefObject<Message[]>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export const useMessageReactions = ({
  channelId,
  channelReady,
  connection,
  currentUserId,
  messagesRef,
  setMessages,
}: UseMessageReactionsParams) => {
  useEffect(() => {
    if (!connection || !channelId || !channelReady) return;

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

    connection.on('ReactionAdded', handleReactionAdded);
    connection.on('ReactionRemoved', handleReactionRemoved);

    return () => {
      connection.off('ReactionAdded', handleReactionAdded);
      connection.off('ReactionRemoved', handleReactionRemoved);
    };
  }, [channelId, channelReady, connection, currentUserId, setMessages]);

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
        prev.map((m) => (m.messageId === messageId ? { ...m, reactions: nextReactions } : m))
      );

      try {
        await (isReacting ? addReaction : removeReaction)(channelId, messageId, emoji);
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.messageId === messageId ? { ...m, reactions: originalReactions } : m))
        );
      }
    },
    [channelId, messagesRef, setMessages]
  );

  return { toggleReaction };
};
