import type { MessageReaction, MessageReactionUser } from '@/types/channel';
import type { UserProfile } from '@/types/user';

export const formatReactionUserNames = (
  names: string[],
  remainingCount: number,
  separator: string,
  lastSeparator: string,
  remainingLabel: string
) => {
  const parts = remainingCount > 0 ? [...names, remainingLabel] : names;

  if (parts.length <= 1) return parts[0] ?? '';
  if (parts.length === 2) return parts.join(lastSeparator);

  return `${parts.slice(0, -1).join(separator)}${lastSeparator}${parts[parts.length - 1]}`;
};

export const getReactionPreviewUsers = (
  reaction: MessageReaction,
  currentUser?: UserProfile | null
): MessageReactionUser[] => {
  const users = reaction.users ?? [];

  if (!reaction.reactedByMe || !currentUser) return users.slice(0, 5);
  if (users.some((user) => user.userId === currentUser.userId)) return users.slice(0, 5);

  return [
    {
      userId: currentUser.userId,
      username: currentUser.username,
      displayName: currentUser.displayName ?? null,
    },
    ...users,
  ].slice(0, 5);
};
