import { GuildProvider } from '@/features/guild/GuildContext';
import { GuildWorkspaceProvider } from '@/features/guild/workspace/GuildWorkspaceProvider';
import { MainLayoutShell } from './MainLayoutShell';

export const MainLayout = () => (
  <GuildProvider>
    <GuildWorkspaceProvider>
      <MainLayoutShell />
    </GuildWorkspaceProvider>
  </GuildProvider>
);
