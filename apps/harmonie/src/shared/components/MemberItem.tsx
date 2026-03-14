import { Avatar } from '@harmonie/ui';
import type { GuildMember } from '@/types/guild';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl.ts';

interface MemberItemProps {
  member: GuildMember;
  onSelect: (member: GuildMember, rect: DOMRect) => void;
}

export const MemberItem = ({ member, onSelect }: MemberItemProps) => {
  const avatarUrl = useFileBlobUrl(member.avatarFileId);
  const label = member.displayName ?? member.username;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onSelect(member, e.currentTarget.getBoundingClientRect());
  };

  return (
    <div
      className="flex items-center gap-3 px-2 py-1.5 mx-1 rounded-sm hover:bg-surface-3 cursor-pointer"
      onClick={handleClick}
    >
      <Avatar
        alt={label}
        avatarUrl={avatarUrl}
        icon={member?.avatar?.icon ?? 'PawPrint'}
        color={member?.avatar?.color ?? 'var(--color-cat-1-fg)'}
        bg={member?.avatar?.bg ?? 'var(--color-cat-1)'}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-1 truncate">{label}</p>
        <p className="text-xs text-text-3 truncate capitalize">{member.role}</p>
      </div>
    </div>
  );
};
