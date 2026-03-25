import { Navigate, useParams } from 'react-router-dom';
import { useChannels } from '@/features/channel/ChannelContext';
import { useGuilds } from '@/features/guild/GuildContext';

export const ChannelIndexPage = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const { channels } = useChannels();
  const { guilds, guildsLoading } = useGuilds();

  if (!guildId || guildsLoading || channels === null) return null;

  const guildExists = guilds.some((guild) => guild.guildId === guildId);

  if (!guildExists) {
    return <Navigate to="/" replace />;
  }

  const textChannels = channels
    .filter((c) => c.type === 'Text')
    .sort((a, b) => a.position - b.position);

  const target = textChannels.find((c) => c.isDefault) ?? textChannels[0];

  if (!target) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/guilds/${guildId}/channels/${target.channelId}`} replace />;
};
