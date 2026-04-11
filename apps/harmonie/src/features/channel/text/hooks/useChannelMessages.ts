import {
  ackChannel,
  addReaction,
  deleteAttachment,
  deleteMessage,
  getChannelMessages,
  removeReaction,
  updateMessage,
} from '@/api/channels';
import { useMessages } from '@/shared/message/hooks/useMessages';
import { useTyping } from '@/shared/message/hooks/useTyping';
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
  const { typingUserIds } = useTyping({
    entityId: channelId,
    ready: channelReady,
    connection,
    currentUserId,
    eventName: 'UserTyping',
    entityIdField: 'channelId',
  });

  return useMessages({
    entityId: channelId,
    ready: channelReady,
    connection,
    currentUserId,
    api: {
      fetchMessages: getChannelMessages,
      ackMessage: ackChannel,
      updateMessage,
      deleteMessage,
      deleteAttachment,
      addReaction,
      removeReaction,
    },
    ws: {
      created: 'MessageCreated',
      updated: 'MessageUpdated',
      deleted: 'MessageDeleted',
      entityIdField: 'channelId',
    },
    typingUserIds,
  });
};
