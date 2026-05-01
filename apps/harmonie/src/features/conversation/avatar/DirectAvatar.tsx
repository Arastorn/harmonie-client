import { Avatar } from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import type { ConversationParticipant } from '@/types/conversation';

interface DirectAvatarProps {
  participant: ConversationParticipant | undefined;
  label: string;
}

export const DirectAvatar = ({ participant, label }: DirectAvatarProps) => {
  const avatarUrl = useFileBlobUrl(participant?.avatarFileId ?? null);
  const hasAvatar = avatarUrl ?? participant?.avatar?.icon;

  return (
    <Avatar
      avatarUrl={avatarUrl}
      icon={participant?.avatar?.icon ?? undefined}
      color={participant?.avatar?.color ?? undefined}
      bg={participant?.avatar?.bg ?? undefined}
      alt={label}
      size={24}
      fallback={hasAvatar ? undefined : label}
    />
  );
};
