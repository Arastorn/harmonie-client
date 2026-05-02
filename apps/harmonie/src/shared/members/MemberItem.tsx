import { useTranslation } from 'react-i18next';
import { Gavel, UserMinus } from 'lucide-react';
import { UserListItem } from '@harmonie/ui';
import type { GuildMember } from '@/types/guild';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';

interface MemberItemProps {
  member: GuildMember;
  onSelect: (member: GuildMember, rect: DOMRect) => void;
  onBan?: (member: GuildMember) => void;
  onRemove?: (member: GuildMember) => void;
}

export const MemberItem = ({ member, onSelect, onBan, onRemove }: MemberItemProps) => {
  const { t } = useTranslation();
  const avatarUrl = useFileBlobUrl(member.avatarFileId);
  const label = member.displayName ?? member.username;

  return (
    <UserListItem
      user={member}
      label={label}
      subtitle={member.role}
      avatarUrl={avatarUrl}
      avatarIcon={member.avatar?.icon ?? 'PawPrint'}
      avatarColor={member.avatar?.color ?? 'var(--color-cat-1-fg)'}
      avatarBg={member.avatar?.bg ?? 'var(--color-cat-1)'}
      onSelect={onSelect}
      contextItems={[
        ...(onRemove
          ? [
              {
                label: t('guild.members.kickAction'),
                icon: <UserMinus size={14} />,
                onClick: () => onRemove(member),
              },
            ]
          : []),
        ...(onBan
          ? [
              {
                label: t('guild.bans.banAction'),
                icon: <Gavel size={14} />,
                onClick: () => onBan(member),
              },
            ]
          : []),
      ]}
    />
  );
};
