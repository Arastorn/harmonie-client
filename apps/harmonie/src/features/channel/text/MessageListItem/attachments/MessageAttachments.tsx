import { useState } from 'react';
import type { MessageAttachment } from '@/types/channel';
import type { GuildMember } from '@/types/guild';
import { MessageAttachmentDeleteModal } from './MessageAttachmentDeleteModal';
import { MessageAttachmentFileChip } from './MessageAttachmentFileChip';
import { MessageAttachmentImage } from './MessageAttachmentImage';
import { MessageAttachmentLightbox } from './MessageAttachmentLightbox';

export interface LightboxState {
  fileId: string;
  fileName: string;
  member?: GuildMember;
  createdAtUtc: string;
}

export interface MessageAttachmentsProps {
  attachments: MessageAttachment[];
  isOwn?: boolean;
  member?: GuildMember;
  messageCreatedAt: string;
  onDelete?: (attachmentFileId: string) => void;
  onDeleteDirect?: (attachmentFileId: string) => void;
}

export const MessageAttachments = ({
  attachments,
  isOwn = false,
  member,
  messageCreatedAt,
  onDelete,
  onDeleteDirect,
}: MessageAttachmentsProps) => {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MessageAttachment | null>(null);

  const handleDeleteRequest = onDeleteDirect
    ? (attachment: MessageAttachment) => onDeleteDirect(attachment.fileId)
    : onDelete
      ? setPendingDelete
      : undefined;

  if (!attachments.length) return null;

  const images = attachments.filter((a) => a.contentType.startsWith('image/'));
  const files = attachments.filter((a) => !a.contentType.startsWith('image/'));

  return (
    <>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {images.map((attachment) => (
            <MessageAttachmentImage
              key={attachment.fileId}
              attachment={attachment}
              isOwn={isOwn}
              member={member}
              createdAtUtc={messageCreatedAt}
              onOpenLightbox={setLightbox}
              onDeleteRequest={handleDeleteRequest}
            />
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          {files.map((attachment) => (
            <MessageAttachmentFileChip
              key={attachment.fileId}
              attachment={attachment}
              isOwn={isOwn}
              onDeleteRequest={handleDeleteRequest}
            />
          ))}
        </div>
      )}
      {lightbox && (
        <MessageAttachmentLightbox
          fileId={lightbox.fileId}
          fileName={lightbox.fileName}
          member={lightbox.member}
          createdAtUtc={lightbox.createdAtUtc}
          onClose={() => setLightbox(null)}
        />
      )}
      {pendingDelete && (
        <MessageAttachmentDeleteModal
          fileName={pendingDelete.fileName}
          onConfirm={() => {
            onDelete?.(pendingDelete.fileId);
            setPendingDelete(null);
          }}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </>
  );
};
