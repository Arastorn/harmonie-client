import type { Conversation } from '@/types/conversation';
import { DirectAvatar } from './DirectAvatar';
import { GroupAvatar } from './GroupAvatar';

interface ConversationAvatarProps {
  conversation: Conversation;
  label: string;
  currentUserId?: string;
}

export const ConversationAvatar = ({
  conversation,
  label,
  currentUserId,
}: ConversationAvatarProps) =>
  conversation.type === 'Group' ? (
    <GroupAvatar participants={conversation.participants} currentUserId={currentUserId} />
  ) : (
    <DirectAvatar
      participant={conversation.participants.find((p) => p.userId !== currentUserId)}
      label={label}
    />
  );
