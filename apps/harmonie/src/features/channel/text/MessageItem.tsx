import { Avatar } from '@harmonie/ui';
import type { Message } from '@/types/channel';
import type { GuildMember } from '@/types/guild';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));

interface MessageItemProps {
  message: Message;
  member?: GuildMember;
  onAvatarClick?: (member: GuildMember, rect: DOMRect) => void;
}

export const MessageItem = ({ message, member, onAvatarClick }: MessageItemProps) => {
  const avatarUrl = useFileBlobUrl(member?.avatarFileId);
  const label = member ? (member.displayName ?? member.username) : message.authorUserId;

  const handleAvatarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (member && onAvatarClick) {
      onAvatarClick(member, e.currentTarget.getBoundingClientRect());
    }
  };

  return (
    <div className="py-3 flex items-start gap-3">
      <div
        onClick={handleAvatarClick}
        className={member && onAvatarClick ? 'cursor-pointer' : undefined}
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
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-sm font-semibold text-text-1">{label}</span>
          <span className="text-xs text-text-3">{formatDate(message.createdAtUtc)}</span>
        </div>
        <p className="text-sm text-text-2 whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
};
