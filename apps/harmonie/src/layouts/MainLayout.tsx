import { Outlet } from 'react-router-dom';
import { GuildProvider } from '@/features/guild/GuildContext';
import { GuildWorkspaceProvider } from '@/features/guild/workspace/GuildWorkspaceProvider';
import { VoicePresenceProvider } from '@/features/channel/voice/VoicePresenceContext';
import { ChannelProvider } from '@/features/channel/ChannelContext';
import { MessageActivityProvider } from '@/features/realtime/MessageActivityContext';
import { ConversationProvider } from '@/features/conversation/ConversationContext';

export const MainLayout = () => (
  <GuildProvider>
    <GuildWorkspaceProvider>
      <ConversationProvider>
        <VoicePresenceProvider>
          <ChannelProvider>
            <MessageActivityProvider>
              <Outlet />
            </MessageActivityProvider>
          </ChannelProvider>
        </VoicePresenceProvider>
      </ConversationProvider>
    </GuildWorkspaceProvider>
  </GuildProvider>
);
