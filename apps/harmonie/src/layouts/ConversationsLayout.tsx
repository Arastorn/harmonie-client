import { ConversationProvider } from '@/features/conversation/ConversationContext';
import { ConversationSidebar } from '@/features/conversation/ConversationSidebar';
import { MainLayoutShell } from './MainLayoutShell';

export const ConversationsLayout = () => (
  <ConversationProvider>
    <MainLayoutShell sidebar={<ConversationSidebar />} showSidepanels={false} />
  </ConversationProvider>
);
