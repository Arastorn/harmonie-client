import { Outlet } from 'react-router-dom';
import { useGuilds } from '@/features/guild/GuildContext';
import { GuildSidebar } from '@/features/guild/GuildSidebar';
import { ChannelSidebar } from '@/features/channel/ChannelSidebar';
import { ChannelProvider } from '@/features/channel/ChannelContext';
import { GuildWorkspaceSidepanels } from '@/features/guild/workspace/GuildWorkspaceSidepanels';
import { MessageActivityProvider } from '@/features/realtime/MessageActivityContext';
import { LayoutSync } from './LayoutSync';

export const MainLayoutShell = () => {
  const { guilds } = useGuilds();
  const hasGuilds = guilds.length > 0;

  return (
    <ChannelProvider>
      <MessageActivityProvider>
        <LayoutSync />
        <div className="flex h-screen bg-background p-3 gap-2 overflow-hidden">
          {hasGuilds && <GuildSidebar />}
          {hasGuilds && <ChannelSidebar />}
          <div className="flex flex-1 gap-2 overflow-hidden min-w-0">
            <div className="flex-1 overflow-hidden min-w-0">
              <main className="h-full overflow-hidden">
                <Outlet />
              </main>
            </div>
            <GuildWorkspaceSidepanels hasGuilds={hasGuilds} />
          </div>
        </div>
      </MessageActivityProvider>
    </ChannelProvider>
  );
};
