import {
  ackChannel,
  addReaction,
  deleteAttachment,
  deleteMessage,
  getChannelMessages,
  pinMessage,
  removeReaction,
  unpinMessage,
  updateMessage,
} from '@/api/channels';
import { useMessages } from '@/shared/message/hooks/useMessages';
import { useTyping } from '@/shared/message/hooks/useTyping';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
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
    eventName: REALTIME_SERVER_EVENTS.userTyping,
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
      pinMessage,
      unpinMessage,
      addReaction,
      removeReaction,
    },
    ws: {
      created: REALTIME_SERVER_EVENTS.messageCreated,
      updated: REALTIME_SERVER_EVENTS.messageUpdated,
      deleted: REALTIME_SERVER_EVENTS.messageDeleted,
      entityIdField: 'channelId',
    },
    typingUserIds,
  });
};
