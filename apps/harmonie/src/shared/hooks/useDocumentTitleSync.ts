import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGuilds } from '@/features/guild/GuildContext';
import { useChannels } from '@/features/channel/ChannelContext';
import { useConversation } from '@/features/conversation/ConversationContext';
import { getConversationLabel } from '@/features/conversation/conversationUtils';
import { useMessageActivity } from '@/features/realtime/MessageActivityContext';
import { useUser } from '@/features/user/UserContext';

const APP_TITLE = 'Harmonie';

export const useDocumentTitleSync = () => {
  const { guilds } = useGuilds();
  const { channels } = useChannels();
  const { totalUnreadCount } = useMessageActivity();
  const { user } = useUser();
  const { guildId, channelId, conversationId } = useParams<{
    guildId: string;
    channelId: string;
    conversationId: string;
  }>();

  const guildName = guilds.find((g) => g.guildId === guildId)?.name;
  const channelName = channels?.find((c) => c.channelId === channelId)?.name;
  const conversation = useConversation(conversationId);

  const conversationName = conversation
    ? getConversationLabel(conversation, user?.userId)
    : undefined;

  useEffect(() => {
    const parts = [APP_TITLE];

    if (conversationName) parts.push(conversationName);
    else {
      if (channelName) parts.push(channelName);
      if (guildName) parts.push(guildName);
    }

    const title = parts.join(' | ');
    document.title = totalUnreadCount > 0 ? `(${totalUnreadCount}) ${title}` : title;
  }, [channelName, guildName, conversationName, totalUnreadCount]);
};
