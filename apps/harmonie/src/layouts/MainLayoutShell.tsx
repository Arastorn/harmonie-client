import { type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useGuilds } from '@/features/guild/GuildContext';
import { GuildSidebar } from '@/features/guild/GuildSidebar';
import { GuildWorkspaceSidepanels } from '@/features/guild/workspace/GuildWorkspaceSidepanels';
import { UserPanel } from '@/features/user/UserPanel';
import { VoiceConnectionBar } from '@/shared/voice/VoiceConnectionBar';
import { LayoutSync } from './LayoutSync';

interface MainLayoutShellProps {
  sidebar: ReactNode;
  showSidepanels?: boolean;
}

export const MainLayoutShell = ({ sidebar, showSidepanels = true }: MainLayoutShellProps) => {
  const { guilds } = useGuilds();
  const hasGuilds = guilds.length > 0;

  return (
    <>
      <LayoutSync />
      <div className="flex h-screen bg-background p-3 gap-2 overflow-hidden">
        <div className="flex h-full shrink-0 flex-col gap-2">
          <div className="flex min-h-0 flex-1 gap-2">
            <GuildSidebar />
            {sidebar}
          </div>
          <div className="rounded-md bg-surface-2">
            <VoiceConnectionBar />
            <UserPanel />
          </div>
        </div>
        <div className="flex flex-1 gap-2 overflow-hidden min-w-0">
          <div className="flex-1 overflow-hidden min-w-0">
            <main className="h-full overflow-hidden">
              <Outlet />
            </main>
          </div>
          {showSidepanels && <GuildWorkspaceSidepanels hasGuilds={hasGuilds} />}
        </div>
      </div>
    </>
  );
};
