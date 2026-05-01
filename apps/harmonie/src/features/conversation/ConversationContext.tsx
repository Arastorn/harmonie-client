import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getConversations } from '@/api/conversations';
import type { Conversation } from '@/types/conversation';

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
