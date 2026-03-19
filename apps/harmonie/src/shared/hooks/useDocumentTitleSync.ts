import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGuilds } from '@/features/guild/GuildContext';
import { useChannels } from '@/features/channel/ChannelContext';
import { useMessageActivity } from '@/features/realtime/MessageActivityContext';

const APP_TITLE = 'Harmonie';

export const useDocumentTitleSync = () => {
  const { guilds } = useGuilds();
  const { channels } = useChannels();
  const { totalUnreadCount } = useMessageActivity();
  const { guildId, channelId } = useParams<{ guildId: string; channelId: string }>();

  const guildName = guilds.find((guild) => guild.guildId === guildId)?.name;
  const channelName = channels?.find((channel) => channel.channelId === channelId)?.name;

  useEffect(() => {
    const parts = [APP_TITLE];

    if (channelName) parts.push(channelName);
    if (guildName) parts.push(guildName);

    const title = parts.join(' | ');
    document.title = totalUnreadCount > 0 ? `(${totalUnreadCount}) ${title}` : title;
  }, [channelName, guildName, totalUnreadCount]);
};
