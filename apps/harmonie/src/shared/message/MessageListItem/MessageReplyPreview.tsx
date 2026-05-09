import { useTranslation } from 'react-i18next';
import { CornerDownRight, Paperclip } from 'lucide-react';
import type { ReplyPreview } from '@/types/channel';
import { stripHtmlToText } from '../utils/messageHtml';

interface MessageReplyPreviewProps {
  replyTo: ReplyPreview;
  onClick?: (messageId: string) => void;
}

export const MessageReplyPreview = ({ replyTo, onClick }: MessageReplyPreviewProps) => {
  const { t } = useTranslation();
  const authorName = replyTo.authorDisplayName ?? replyTo.authorUsername;
  const preview = replyTo.isDeleted
    ? t('channel.messages.replyDeleted')
    : replyTo.content
      ? stripHtmlToText(replyTo.content)
      : replyTo.hasAttachments
        ? t('channel.messages.attachmentOnly')
        : t('channel.messages.replyEmpty');

  return (
    <button
      type="button"
      onClick={() => onClick?.(replyTo.messageId)}
      className="mb-1 flex max-w-full items-center gap-1.5 text-left text-xs text-text-3 transition-colors hover:text-text-1 cursor-pointer"
    >
      <CornerDownRight size={13} className="shrink-0 text-primary" />
      {!replyTo.isDeleted && (
        <span className="shrink-0 max-w-32 truncate font-semibold text-text-2">{authorName}</span>
      )}
      {replyTo.hasAttachments && !replyTo.content && !replyTo.isDeleted && (
        <Paperclip size={12} className="shrink-0" />
      )}
      <span className="min-w-0 truncate">{preview}</span>
    </button>
  );
};
