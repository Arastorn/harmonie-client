import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AttachmentFileChip, IconButton } from '@harmonie/ui';
import type { MessageAttachment } from '@/types/channel';
import { useFileDownload } from '@/shared/hooks/useFileDownload';
import { formatFileSize } from '@/shared/utils/file';

interface MessageAttachmentFileChipProps {
  attachment: MessageAttachment;
  isOwn: boolean;
  onDeleteRequest?: (attachment: MessageAttachment) => void;
}

export const MessageAttachmentFileChip = ({
  attachment,
  isOwn,
  onDeleteRequest,
}: MessageAttachmentFileChipProps) => {
  const { t } = useTranslation();
  const { download, downloading } = useFileDownload();

  return (
    <AttachmentFileChip
      fileName={attachment.fileName}
      fileSize={formatFileSize(attachment.sizeBytes)}
      actions={
        <>
          <IconButton
            size="small"
            variant="ghost"
            onClick={() => void download(attachment.fileId, attachment.fileName)}
            disabled={downloading}
            aria-label={t('channel.messages.download')}
            title={t('channel.messages.download')}
          >
            <Download size={14} />
          </IconButton>
          {isOwn && onDeleteRequest && (
            <IconButton
              size="small"
              variant="ghost"
              onClick={() => onDeleteRequest(attachment)}
              aria-label={t('channel.messages.deleteAttachment')}
              title={t('channel.messages.deleteAttachment')}
            >
              <X size={14} />
            </IconButton>
          )}
        </>
      }
    />
  );
};
