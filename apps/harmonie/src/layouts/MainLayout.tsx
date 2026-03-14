import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Users } from 'lucide-react';
import { IconButton } from '@harmonie/ui';
import { GuildProvider, useGuilds } from '@/features/guild/GuildContext';
import { GuildSidebar } from '@/features/guild/GuildSidebar';
import { ChannelSidebar } from '@/features/channel/ChannelSidebar';
import { ChannelProvider } from '@/features/channel/ChannelContext';
import { MembersPanel } from '@/features/guild/MembersPanel';

const AppShell = () => {
  const { guilds } = useGuilds();
  const hasGuilds = guilds.length > 0;
  const [membersOpen, setMembersOpen] = useState(false);

  return (
    <ChannelProvider>
      <div className="flex h-screen bg-background p-2 gap-2 overflow-hidden">
        {hasGuilds && <GuildSidebar />}
        {hasGuilds && <ChannelSidebar />}
        <div className="flex flex-1 gap-2 overflow-hidden min-w-0">
          <div className="relative flex-1 overflow-hidden min-w-0">
            <main className="h-full overflow-hidden">
              <Outlet />
            </main>
            {hasGuilds && (
              <div className="absolute top-2 right-2 z-10">
                <IconButton size="small" onClick={() => setMembersOpen((o) => !o)}>
                  <Users size={16} />
                </IconButton>
              </div>
            )}
          </div>
          {hasGuilds && membersOpen && <MembersPanel onClose={() => setMembersOpen(false)} />}
        </div>
      </div>
    </ChannelProvider>
  );
};

export const MainLayout = () => (
  <GuildProvider>
    <AppShell />
  </GuildProvider>
);
