import { Avatar } from '@harmonie/ui';
import type { Message } from '@/types/channel';
import type { GuildMember } from '@/types/guild';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { formatRelative } from 'date-fns';

interface MessageItemProps {
  message: Message;
  member?: GuildMember;
  grouped?: boolean;
  onAvatarClick?: (member: GuildMember, rect: DOMRect) => void;
}

export const MessageItem = ({
  message,
  member,
  grouped = false,
  onAvatarClick,
}: MessageItemProps) => {
  const avatarUrl = useFileBlobUrl(member?.avatarFileId);
  const label = member ? (member.displayName ?? member.username) : message.authorUserId;
  const handleAvatarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (member && onAvatarClick) {
      onAvatarClick(member, e.currentTarget.getBoundingClientRect());
    }
  };

  return (
    <div className={['flex items-start gap-3', grouped ? 'py-0.5' : 'pt-3 pb-1'].join(' ')}>
      {grouped ? (
        <div className="w-8 shrink-0" />
      ) : (
        <div
          onClick={handleAvatarClick}
          className={member && onAvatarClick ? 'cursor-pointer shrink-0' : 'shrink-0'}
        >
          <Avatar
            alt={label}
            avatarUrl={avatarUrl}
            icon={member?.avatar?.icon ?? 'PawPrint'}
            color={member?.avatar?.color ?? 'var(--color-cat-1-fg)'}
            bg={member?.avatar?.bg ?? 'var(--color-cat-1)'}
            size={32}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {!grouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-sm font-semibold text-text-1">{label}</span>
            <span className="text-xs text-text-3">
              {formatRelative(new Date(message.createdAtUtc), new Date())}
            </span>
          </div>
        )}
        <p className="text-sm text-text-2 whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
};
