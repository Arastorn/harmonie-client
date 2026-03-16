import { Avatar } from '@harmonie/ui';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const avatarUrl = useFileBlobUrl(member?.avatarFileId);
  const label = member
    ? (member.displayName ?? member.username)
    : t('channel.messages.memberNotFound');
  const handleAvatarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (member && onAvatarClick) {
      onAvatarClick(member, e.currentTarget.getBoundingClientRect());
    }
  };
  const avatarIcon = member?.avatar?.icon ?? (member ? 'PawPrint' : 'User');
  const avatarColor =
    member?.avatar?.color ?? (member ? 'var(--color-cat-1-fg)' : 'var(--color-text-3)');
  const avatarBg = member?.avatar?.bg ?? (member ? 'var(--color-cat-1)' : 'var(--color-surface-3)');

  return (
    <div className={['flex items-start gap-3', grouped ? 'py-0.5' : 'pt-3 pb-1'].join(' ')}>
      {grouped ? (
        <div className="w-8 shrink-0" />
      ) : (
        <div
          onClick={handleAvatarClick}
          className={member && onAvatarClick ? 'cursor-pointer shrink-0' : 'shrink-0'}
        >
          <div className={member ? '' : 'opacity-60'}>
            <Avatar
              alt={label}
              avatarUrl={avatarUrl}
              icon={avatarIcon}
              color={avatarColor}
              bg={avatarBg}
              size={32}
            />
          </div>
        </div>
      )}
      <div className="flex-1 min-w-0">
        {!grouped && (
          <div
            className={['flex items-baseline gap-2 mb-0.5', member ? '' : 'opacity-70'].join(' ')}
          >
            <span className="text-sm font-semibold text-text-1">{label}</span>
            <span className="text-xs text-text-3">
              {formatRelative(new Date(message.createdAtUtc), new Date())}
            </span>
          </div>
        )}
        <p className="text-sm text-text-2 whitespace-pre-wrap wrap-break-word">{message.content}</p>
      </div>
    </div>
  );
};
