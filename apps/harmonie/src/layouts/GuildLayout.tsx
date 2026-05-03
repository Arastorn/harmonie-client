import { Navigate, useParams } from 'react-router-dom';
import { useGuilds } from '@/features/guild/GuildContext';
import { ChannelSidebar } from '@/features/channel/ChannelSidebar';
import { MainLayoutShell } from './MainLayoutShell';

export const GuildLayout = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const { guilds, guildsLoading } = useGuilds();

  if (guildId && !guildsLoading && !guilds.some((guild) => guild.guildId === guildId)) {
    return <Navigate to="/conversations" replace />;
  }

  return <MainLayoutShell sidebar={guilds.length > 0 ? <ChannelSidebar /> : null} />;
};
