import { useTranslation } from 'react-i18next';
import { Gavel } from 'lucide-react';
import { Avatar, ContextMenu } from '@harmonie/ui';
import type { GuildMember } from '@/types/guild';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { useState } from 'react';

interface MemberItemProps {
  member: GuildMember;
  onSelect: (member: GuildMember, rect: DOMRect) => void;
  onBan?: (member: GuildMember) => void;
}

export const MemberItem = ({ member, onSelect, onBan }: MemberItemProps) => {
  const { t } = useTranslation();
  const avatarUrl = useFileBlobUrl(member.avatarFileId);
  const label = member.displayName ?? member.username;
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onSelect(member, e.currentTarget.getBoundingClientRect());
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onBan) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div
        className="flex items-center gap-3 px-2 py-1.5 mx-1 rounded-sm hover:bg-surface-3 cursor-pointer"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
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

      {contextMenu && onBan && (
        <ContextMenu
          position={contextMenu}
          horizontalAnchor="right"
          onClose={() => setContextMenu(null)}
          items={[
            {
              label: t('guild.bans.banAction'),
              icon: <Gavel size={14} />,
              onClick: () => {
                setContextMenu(null);
                onBan(member);
              },
            },
          ]}
        />
      )}
    </>
  );
};
