import { Outlet } from 'react-router-dom';
import { GuildProvider } from '@/features/guild/GuildContext';
import { GuildWorkspaceProvider } from '@/features/guild/workspace/GuildWorkspaceProvider';
import { VoicePresenceProvider } from '@/features/channel/voice/VoicePresenceContext';
import { ChannelProvider } from '@/features/channel/ChannelContext';
import { MessageActivityProvider } from '@/features/realtime/MessageActivityContext';

export const MainLayout = () => (
  <GuildProvider>
    <GuildWorkspaceProvider>
      <VoicePresenceProvider>
        <ChannelProvider>
          <MessageActivityProvider>
            <Outlet />
          </MessageActivityProvider>
        </ChannelProvider>
      </VoicePresenceProvider>
    </GuildWorkspaceProvider>
  </GuildProvider>
);
