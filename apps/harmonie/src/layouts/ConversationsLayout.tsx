import { ConversationSidebar } from '@/features/conversation/ConversationSidebar';
import { MainLayoutShell } from './MainLayoutShell';

export const ConversationsLayout = () => (
  <MainLayoutShell sidebar={<ConversationSidebar />} showSidepanels={false} />
);
