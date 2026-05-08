import type { Conversation, ConversationParticipant } from '@/types/conversation';

type ConversationParticipantSource = Pick<ConversationParticipant, 'userId' | 'username'> &
  Partial<Pick<ConversationParticipant, 'displayName' | 'bio' | 'avatarFileId' | 'avatar'>>;

export const userToConversationParticipant = (
  user: ConversationParticipantSource
): ConversationParticipant => ({
  userId: user.userId,
  username: user.username,
  displayName: user.displayName ?? null,
  bio: user.bio ?? null,
  avatarFileId: user.avatarFileId ?? null,
  avatar: user.avatar ?? null,
});

const getParticipantLabel = (participant: ConversationParticipant): string =>
  participant.displayName ?? participant.username;

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
    return conversation.name ?? list.map(getParticipantLabel).join(', ');
  }
  const other = currentUserId
    ? participants.find((p) => p.userId !== currentUserId)
    : participants[0];
  return other ? getParticipantLabel(other) : conversation.conversationId;
};
