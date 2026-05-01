import {
  ackConversation,
  addConversationReaction,
  deleteConversationMessage,
  deleteConversationMessageAttachment,
  getConversationMessages,
  removeConversationReaction,
  updateConversationMessage,
} from '@/api/conversations';
import { useMessages } from '@/shared/message/hooks/useMessages';
import { useTyping } from '@/shared/message/hooks/useTyping';
import type { HubConnection } from '@microsoft/signalr';

interface UseConversationMessagesParams {
  conversationId?: string;
  connection: HubConnection | null;
  currentUserId?: string;
}

export const useConversationMessages = ({
  conversationId,
  connection,
  currentUserId,
}: UseConversationMessagesParams) => {
  const { typingUserIds } = useTyping({
    entityId: conversationId,
    connection,
    currentUserId,
    eventName: 'ConversationUserTyping',
    entityIdField: 'conversationId',
  });

  return useMessages({
    entityId: conversationId,
    connection,
    currentUserId,
    api: {
      fetchMessages: getConversationMessages,
      ackMessage: ackConversation,
      updateMessage: updateConversationMessage,
      deleteMessage: deleteConversationMessage,
      deleteAttachment: deleteConversationMessageAttachment,
      addReaction: addConversationReaction,
      removeReaction: removeConversationReaction,
    },
    ws: {
      created: 'ConversationMessageCreated',
      updated: 'ConversationMessageUpdated',
      deleted: 'ConversationMessageDeleted',
      entityIdField: 'conversationId',
    },
    typingUserIds,
  });
};
