import type { Conversation, ConversationParticipant } from '@/types/conversation';
import type { GuildMember } from '@/types/guild';

export const participantToMember = (p: ConversationParticipant): GuildMember => ({
  userId: p.userId,
  username: p.username,
  displayName: p.displayName ?? null,
  avatarFileId: p.avatarFileId ?? null,
  avatar: p.avatar ?? undefined,
  isActive: true,
  role: 'Member',
  joinedAtUtc: '',
});

export const getConversationLabel = (
  conversation: Conversation,
  currentUserId: string | undefined
): string => {
  const participants = conversation.participants ?? [];
  if (conversation.type === 'Group') {
    const others = currentUserId
      ? participants.filter((p) => p.userId !== currentUserId)
      : participants;
    const list = others.length > 0 ? others : participants;
    return conversation.name ?? list.map((p) => p.username).join(', ');
  }
  const other = currentUserId
    ? participants.find((p) => p.userId !== currentUserId)
    : participants[0];
  return other?.username ?? conversation.conversationId;
};
