import { useState } from 'react';
import { Avatar } from '@harmonie/ui';
import { useTranslation } from 'react-i18next';
import type { Message } from '@/types/channel';
import type { UserProfile } from '@/types/user';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { formatContextualDateTime } from '@/shared/utils/date';
import type { MessageAuthor } from '@/shared/message/types';
import { MessageAttachments } from '@/shared/message/attachments/MessageAttachments';
import { MessageReactions } from '@/shared/message/reactions/MessageReactions';
import { MessageActions } from './MessageActions';
import { MessageContent } from './MessageContent';
import { MessageEmojiPicker } from './MessageEmojiPicker';
import { MessageInlineEditor } from './MessageInlineEditor';

interface MessageListItemProps<TAuthor extends MessageAuthor = MessageAuthor> {
  message: Message;
  member?: TAuthor;
  grouped?: boolean;
  isOwn?: boolean;
  isEditing?: boolean;
  isMenuOpen?: boolean;
  isSelected?: boolean;
  onAvatarClick?: (member: TAuthor, rect: DOMRect) => void;
  onEdit?: (messageId: string) => void;
  onCancelEdit?: () => void;
  onSaveEdit?: (messageId: string, content: string) => Promise<void>;
  onDelete?: (messageId: string) => void;
  onAttachmentDeleted?: (attachmentFileId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  reactionSource?: {
    type: 'channel' | 'conversation';
    entityId: string;
  };
  reactionUserMap?: ReadonlyMap<string, MessageAuthor>;
  currentUser?: UserProfile | null;
  onOpenMenu?: (
    event: React.MouseEvent<HTMLElement>,
    messageId: string,
    horizontalAnchor?: 'left' | 'right'
  ) => void;
}

export const MessageListItem = <TAuthor extends MessageAuthor = MessageAuthor>({
  message,
  member,
  grouped = false,
  isOwn = false,
  isEditing = false,
  isMenuOpen = false,
  isSelected = false,
  onAvatarClick,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onAttachmentDeleted,
  onReact,
  reactionSource,
  reactionUserMap,
  currentUser,
  onOpenMenu,
}: MessageListItemProps<TAuthor>) => {
  const { t, i18n } = useTranslation();
  const [pickerAnchorRect, setPickerAnchorRect] = useState<DOMRect | null>(null);
  const avatarUrl = useFileBlobUrl(member?.avatarFileId);
  const label = member
    ? (member.displayName ?? member.username)
    : t('channel.messages.memberNotFound');
  const avatarIcon = member?.avatar?.icon ?? (member ? 'PawPrint' : 'User');
  const avatarColor =
    member?.avatar?.color ?? (member ? 'var(--color-cat-1-fg)' : 'var(--color-text-3)');
  const avatarBg = member?.avatar?.bg ?? (member ? 'var(--color-cat-1)' : 'var(--color-surface-3)');

  const handleAvatarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!member || !onAvatarClick) return;
    onAvatarClick(member, event.currentTarget.getBoundingClientRect());
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (!isOwn || !(onEdit || onDelete)) return;
    event.preventDefault();
    onOpenMenu?.(event, message.messageId, 'right');
  };

  const handlePickerOpen = (rect: DOMRect) => {
    setPickerAnchorRect((prev) => (prev ? null : rect));
  };

  const handleReact = (emoji: string) => {
    onReact?.(message.messageId, emoji);
    setPickerAnchorRect(null);
  };

  return (
    <div
      data-message-id={message.messageId}
      onContextMenu={handleContextMenu}
      className={[
        'group flex items-start gap-2 sm:gap-3 relative px-1 sm:px-2 -mx-1 sm:-mx-2 rounded-sm min-w-0',
        'hover:bg-surface-2 transition-colors',
        isEditing || isMenuOpen || pickerAnchorRect ? 'bg-surface-3' : '',
        isSelected ? 'bg-surface-3 ring-1 ring-primary/60' : '',
        grouped ? 'py-0.5' : 'pt-3 pb-2',
      ].join(' ')}
    >
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
            className={[
              'flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-0.5 min-w-0',
              member ? '' : 'opacity-70',
            ].join(' ')}
          >
            <span className="text-sm font-semibold text-text-1 min-w-0 max-w-full truncate">
              {label}
            </span>
            <span className="text-xs text-text-3 shrink-0">
              {formatContextualDateTime(message.createdAtUtc, i18n.language, t)}
            </span>
          </div>
        )}

        {isEditing ? (
          <MessageInlineEditor
            initialValue={message.content}
            onCancel={() => onCancelEdit?.()}
            onSave={(content) => onSaveEdit?.(message.messageId, content) ?? Promise.resolve()}
          />
        ) : (
          <>
            {message.content && <MessageContent content={message.content} />}
            {message.updatedAtUtc && (
              <span className="text-xs text-text-3">{t('channel.messages.edited')}</span>
            )}
            <MessageAttachments
              attachments={message.attachments}
              isOwn={isOwn}
              member={member}
              messageCreatedAt={message.createdAtUtc}
              onDelete={onAttachmentDeleted}
              onDeleteDirect={
                onAttachmentDeleted && !message.content && message.attachments.length === 1
                  ? () => onDelete?.(message.messageId)
                  : undefined
              }
            />
          </>
        )}
        <MessageReactions
          messageId={message.messageId}
          reactions={message.reactions}
          reactionSource={reactionSource}
          reactionUserMap={reactionUserMap}
          currentUser={currentUser}
          onToggle={(emoji) => onReact?.(message.messageId, emoji)}
        />
      </div>

      {!isEditing && (
        <MessageActions
          canEdit={isOwn && Boolean(onEdit)}
          canDelete={isOwn && Boolean(onDelete)}
          canReact={Boolean(onReact)}
          editLabel={t('channel.messages.edit')}
          deleteLabel={t('channel.messages.delete')}
          reactLabel={t('channel.messages.react')}
          onEdit={() => onEdit?.(message.messageId)}
          onDelete={() => onDelete?.(message.messageId)}
          onPickerOpen={handlePickerOpen}
        />
      )}

      {pickerAnchorRect && (
        <MessageEmojiPicker
          anchorRect={pickerAnchorRect}
          onSelect={handleReact}
          onClose={() => setPickerAnchorRect(null)}
        />
      )}
    </div>
  );
};
