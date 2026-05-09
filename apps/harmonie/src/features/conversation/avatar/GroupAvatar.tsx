import { Avatar, AvatarGroup } from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import type { ConversationParticipant } from '@/types/conversation';

const MiniParticipantAvatar = ({ participant }: { participant: ConversationParticipant }) => {
  const avatarUrl = useFileBlobUrl(participant.avatarFileId ?? null);
  const hasAvatar = avatarUrl || participant.avatar?.icon;

  return (
    <Avatar
      avatarUrl={avatarUrl}
      icon={participant.avatar?.icon ?? undefined}
      color={participant.avatar?.color ?? undefined}
      bg={participant.avatar?.bg ?? undefined}
      alt={participant.username}
      size={16}
      fallback={hasAvatar ? undefined : participant.username}
    />
  );
};

interface GroupAvatarProps {
  participants: ConversationParticipant[];
  currentUserId?: string;
  label: string;
}

export const GroupAvatar = ({ participants, currentUserId, label }: GroupAvatarProps) => {
  const others = participants.filter((p) => p.userId !== currentUserId).slice(0, 2);

  if (others.length === 0) {
    return <Avatar icon="Users" alt={label} size={24} />;
  }

  return (
    <AvatarGroup size={24}>
      {others.map((p) => (
        <MiniParticipantAvatar key={p.userId} participant={p} />
      ))}
    </AvatarGroup>
  );
};
