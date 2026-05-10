import { type ReactNode } from 'react';
import { Outlet, useParams } from 'react-router-dom';
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
  const { channelId, conversationId } = useParams<{
    channelId?: string;
    conversationId?: string;
  }>();
  const hasGuilds = guilds.length > 0;
  const hasMobileDetail = Boolean(channelId || conversationId);

  return (
    <>
      <LayoutSync />
      <div className="flex h-dvh gap-0 overflow-hidden bg-background p-0 md:gap-2 md:p-3">
        <div
          className={[
            'h-full shrink-0 flex-col gap-0 md:gap-2',
            hasMobileDetail ? 'hidden md:flex' : 'flex w-full md:w-auto',
          ].join(' ')}
        >
          <div className="flex min-h-0 flex-1 gap-0 md:gap-2">
            <GuildSidebar />
            {sidebar}
          </div>
          <div className="rounded-t-md bg-surface-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:rounded-md md:pb-0">
            <VoiceConnectionBar />
            <UserPanel />
          </div>
        </div>
        <div
          className={[
            'min-w-0 flex-1 gap-2 overflow-hidden',
            hasMobileDetail ? 'flex' : 'hidden md:flex',
          ].join(' ')}
        >
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
