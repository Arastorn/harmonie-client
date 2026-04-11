import { useGuilds } from '@/features/guild/GuildContext';
import { ChannelSidebar } from '@/features/channel/ChannelSidebar';
import { MainLayoutShell } from './MainLayoutShell';

export const GuildLayout = () => {
  const { guilds } = useGuilds();
  return <MainLayoutShell sidebar={guilds.length > 0 ? <ChannelSidebar /> : null} />;
};
