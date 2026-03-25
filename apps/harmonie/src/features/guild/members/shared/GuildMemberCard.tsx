import { ReactNode } from 'react';
import { Avatar, RowCard } from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';

export interface MemberCardUser {
  avatarFileId?: string | null;
  avatar?: { color?: string | null; icon?: string | null; bg?: string | null } | null;
  username: string;
  displayName?: string | null;
}

interface GuildMemberCardProps {
  user: MemberCardUser;
  children: ReactNode;
  extra?: ReactNode;
}

export const GuildMemberCard = ({ user, children, extra }: GuildMemberCardProps) => {
  const avatarUrl = useFileBlobUrl(user.avatarFileId ?? null);
  const label = user.displayName ?? user.username;

  return (
    <RowCard className={extra ? 'flex-col gap-2 items-stretch' : undefined}>
      <div className="flex flex-1 items-center gap-3">
        <Avatar
          alt={label}
          avatarUrl={avatarUrl}
          icon={user.avatar?.icon ?? 'PawPrint'}
          color={user.avatar?.color ?? 'var(--color-cat-1-fg)'}
          bg={user.avatar?.bg ?? 'var(--color-cat-1)'}
          size={32}
        />
        {children}
      </div>
      {extra && <div className="pl-11">{extra}</div>}
    </RowCard>
  );
};
