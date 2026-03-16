import { Navigate, useParams } from 'react-router-dom';
import { useChannels } from '@/features/channel/ChannelContext';
import { useGuilds } from '@/features/guild/GuildContext';

// Redirects to the default text channel of a guild when landing on /guilds/:guildId
export const ChannelIndexPage = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const { channels } = useChannels();
  const { guilds, guildsLoading } = useGuilds();

  // Still loading — wait before redirecting
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
