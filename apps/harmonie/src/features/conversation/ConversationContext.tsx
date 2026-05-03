import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getConversations } from '@/api/conversations';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
import { useUser } from '@/features/user/UserContext';
import type {
  Conversation,
  ConversationParticipantLeftEvent,
  ConversationUpdatedEvent,
} from '@/types/conversation';

interface ConversationContextValue {
  conversations: Conversation[] | null;
  fetchConversations: () => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversation: Conversation) => void;
  removeConversation: (conversationId: string) => void;
}

const ConversationContext = createContext<ConversationContextValue>({
  conversations: null,
  fetchConversations: () => {},
  addConversation: () => {},
  updateConversation: () => {},
  removeConversation: () => {},
});

export const ConversationProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { conversationId: activeConversationId } = useParams<{ conversationId: string }>();
  const { connection } = useRealtime();
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);

  const fetchConversations = useCallback(() => {
    getConversations()
      .then((data) =>
        setConversations(
          data.conversations.map((c) => ({
            ...c,
            type: (c.type.charAt(0).toUpperCase() +
              c.type.slice(1).toLowerCase()) as Conversation['type'],
          }))
        )
      )
      .catch(() => setConversations([]));
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!connection) return;

    const handleConversationCreated = () => {
      fetchConversations();
    };

    const handleConversationUpdated = (event: ConversationUpdatedEvent) => {
      setConversations((prev) =>
        prev
          ? prev.map((conversation) =>
              conversation.conversationId === event.conversationId
                ? { ...conversation, name: event.name }
                : conversation
            )
          : prev
      );
    };

    const handleConversationParticipantLeft = (event: ConversationParticipantLeftEvent) => {
      if (event.userId === user?.userId) {
        setConversations((prev) =>
          prev
            ? prev.filter((conversation) => conversation.conversationId !== event.conversationId)
            : prev
        );
        if (event.conversationId === activeConversationId) {
          navigate('/conversations', { replace: true });
        }
        return;
      }

      setConversations((prev) =>
        prev
          ? prev.map((conversation) =>
              conversation.conversationId === event.conversationId
                ? {
                    ...conversation,
                    participants: conversation.participants.filter(
                      (participant) => participant.userId !== event.userId
                    ),
                  }
                : conversation
            )
          : prev
      );
    };

    connection.on(REALTIME_SERVER_EVENTS.conversationCreated, handleConversationCreated);
    connection.on(REALTIME_SERVER_EVENTS.conversationUpdated, handleConversationUpdated);
    connection.on(
      REALTIME_SERVER_EVENTS.conversationParticipantLeft,
      handleConversationParticipantLeft
    );

    return () => {
      connection.off(REALTIME_SERVER_EVENTS.conversationCreated, handleConversationCreated);
      connection.off(REALTIME_SERVER_EVENTS.conversationUpdated, handleConversationUpdated);
      connection.off(
        REALTIME_SERVER_EVENTS.conversationParticipantLeft,
        handleConversationParticipantLeft
      );
    };
  }, [activeConversationId, connection, fetchConversations, navigate, user?.userId]);

  const addConversation = (conversation: Conversation) =>
    setConversations((prev) =>
      prev
        ? prev.some((c) => c.conversationId === conversation.conversationId)
          ? prev
          : [conversation, ...prev]
        : [conversation]
    );

  const updateConversation = (conversation: Conversation) =>
    setConversations((prev) =>
      prev
        ? prev.map((c) => (c.conversationId === conversation.conversationId ? conversation : c))
        : null
    );

  const removeConversation = (conversationId: string) =>
    setConversations((prev) =>
      prev ? prev.filter((c) => c.conversationId !== conversationId) : null
    );

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        fetchConversations,
        addConversation,
        updateConversation,
        removeConversation,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversations = () => useContext(ConversationContext);

export const useConversation = (conversationId: string | undefined) => {
  const { conversations } = useContext(ConversationContext);
  return conversations?.find((c) => c.conversationId === conversationId) ?? null;
};
