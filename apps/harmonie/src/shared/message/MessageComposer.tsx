import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { IconButton, RichTextMessageInput } from '@harmonie/ui';
import { deleteFile, uploadFile } from '@/api/files';
import type { Message, ReplyPreview } from '@/types/channel';
import { useMessageDraft } from './hooks/useMessageDraft';
import { useMessageFormattingPreference } from './hooks/useMessageFormattingPreference';
import { getMessagePayloadContent, stripHtmlToText } from './utils/messageHtml';
import { getRichTextMessageInputLabels } from './utils/richTextMessageInputLabels';

const MAX_LENGTH = 4000;
const TYPING_THROTTLE_MS = 4000;
const ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/zip',
];

interface PendingAttachment {
  localId: string;
  file: File;
  fileId?: string;
  status: 'uploading' | 'done' | 'error';
  previewUrl?: string;
}

interface MessageComposerProps {
  draftKey?: string;
  sendFn: (
    content: string,
    attachmentFileIds: string[],
    replyToMessageId?: string | null
  ) => Promise<unknown>;
  onTypingStart?: () => void;
  latestEditableMessage?: Message | null;
  onEditingRequested?: (messageId: string) => void;
  replyTo?: ReplyPreview | null;
  onCancelReply?: () => void;
}

export const MessageComposer = ({
  draftKey,
  sendFn,
  onTypingStart,
  latestEditableMessage = null,
  onEditingRequested,
  replyTo = null,
  onCancelReply,
}: MessageComposerProps) => {
  const { t } = useTranslation();
  const { clearDraft, content, setContent } = useMessageDraft(draftKey);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { formattingOpen, toggleFormattingOpen } = useMessageFormattingPreference();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTypingSentRef = useRef<number>(0);
  const inputLabels = getRichTextMessageInputLabels(t);

  const textContent = stripHtmlToText(content);
  const payloadContent = getMessagePayloadContent(content);
  const isOverLimit = payloadContent.length > MAX_LENGTH;
  const trimmedContent = textContent.trim();
  const isUploading = pendingAttachments.some((a) => a.status === 'uploading');
  const doneAttachments = pendingAttachments.filter((a) => a.status === 'done');
  const canSend =
    !sending && !isOverLimit && (!!trimmedContent || (doneAttachments.length > 0 && !isUploading));

  useEffect(() => {
    return () => {
      pendingAttachments.forEach((a) => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (value: string) => {
    setContent(value);
    if (onTypingStart && stripHtmlToText(value)) {
      const now = Date.now();
      if (now - lastTypingSentRef.current > TYPING_THROTTLE_MS) {
        lastTypingSentRef.current = now;
        onTypingStart();
      }
    }
  };

  const addFiles = useCallback(
    (files: File[]) => {
      const accepted = files.filter((f) => ACCEPTED_TYPES.includes(f.type));
      if (!accepted.length) return;

      const newAttachments: PendingAttachment[] = accepted.map((file) => ({
        localId: `${Date.now()}-${Math.random()}`,
        file,
        status: 'uploading',
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));

      setPendingAttachments((prev) => [...prev, ...newAttachments]);

      newAttachments.forEach((attachment) => {
        uploadFile(attachment.file)
          .then((uploaded) => {
            setPendingAttachments((prev) =>
              prev.map((a) =>
                a.localId === attachment.localId
                  ? { ...a, fileId: uploaded.fileId, status: 'done' }
                  : a
              )
            );
          })
          .catch(() => {
            setPendingAttachments((prev) =>
              prev.map((a) => (a.localId === attachment.localId ? { ...a, status: 'error' } : a))
            );
            setError(t('channel.input.uploadError'));
          });
      });
    },
    [t]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    addFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeAttachment = (localId: string) => {
    setPendingAttachments((prev) => {
      const attachment = prev.find((a) => a.localId === localId);
      if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      if (attachment?.fileId) deleteFile(attachment.fileId).catch(() => {});
      return prev.filter((a) => a.localId !== localId);
    });
  };

  const submit = async () => {
    if (!canSend) return;

    setSending(true);
    setError(undefined);

    const attachmentFileIds = doneAttachments.map((a) => a.fileId!);

    try {
      await sendFn(payloadContent, attachmentFileIds, replyTo?.messageId ?? null);
      clearDraft();
      onCancelReply?.();
      setPendingAttachments((prev) => {
        prev.forEach((a) => {
          if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
        });
        return [];
      });
    } catch {
      setError(t('channel.input.error'));
    } finally {
      setSending(false);
    }
  };

  const attachmentsPreview =
    pendingAttachments.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {pendingAttachments.map((attachment) => (
          <div
            key={attachment.localId}
            className="relative flex items-center rounded-md border border-border-2 bg-surface-3 overflow-hidden"
          >
            {attachment.previewUrl ? (
              <img
                src={attachment.previewUrl}
                alt={attachment.file.name}
                className="h-14 w-14 object-cover"
              />
            ) : (
              <div className="h-14 w-14 flex items-center justify-center text-xs text-text-3 text-center px-1 leading-tight">
                {attachment.file.name.split('.').pop()?.toUpperCase()}
              </div>
            )}
            {attachment.status === 'uploading' && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {attachment.status === 'error' && (
              <div className="absolute inset-0 bg-error/40 flex items-center justify-center">
                <span className="text-error-fg text-xs font-medium">!</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => removeAttachment(attachment.localId)}
              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
              aria-label={t('channel.input.removeAttachment')}
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
    ) : undefined;

  return (
    <div className="flex w-full pt-2 self-end">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        className={`flex-1 rounded-md transition-colors ${isDragOver ? 'ring-2 ring-primary' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {replyTo && (
          <div className="mb-2 flex items-start gap-2 rounded-md border border-border-2 bg-surface-2 px-3 py-2">
            <div className="mt-0.5 h-8 w-0.5 shrink-0 rounded-full bg-primary" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-text-1 truncate">
                {replyTo.isDeleted
                  ? t('channel.messages.replyDeleted')
                  : t('channel.messages.replyingTo', {
                      name: replyTo.authorDisplayName ?? replyTo.authorUsername,
                    })}
              </div>
              {!replyTo.isDeleted && (
                <div className="text-xs text-text-3 truncate">
                  {replyTo.content
                    ? stripHtmlToText(replyTo.content)
                    : replyTo.hasAttachments
                      ? t('channel.messages.attachmentOnly')
                      : t('channel.messages.replyEmpty')}
                </div>
              )}
            </div>
            <IconButton
              type="button"
              size="small"
              onClick={onCancelReply}
              title={t('channel.messages.cancelReply')}
              className="shrink-0"
            >
              <X size={14} />
            </IconButton>
          </div>
        )}
        {attachmentsPreview && <div className="mb-2">{attachmentsPreview}</div>}
        <RichTextMessageInput
          value={content}
          onChange={handleChange}
          placeholder={t('channel.input.placeholder')}
          disabled={sending}
          error={
            isOverLimit
              ? t('channel.input.tooLong', { max: MAX_LENGTH, count: payloadContent.length })
              : error
          }
          onSubmit={() => void submit()}
          onArrowUpWhenEmpty={
            latestEditableMessage
              ? () => onEditingRequested?.(latestEditableMessage.messageId)
              : undefined
          }
          onPasteFiles={addFiles}
          onAttachClick={() => fileInputRef.current?.click()}
          showFormattingTools={formattingOpen}
          onToggleFormattingTools={toggleFormattingOpen}
          autoFocus
          autoFocusPlacement="end"
          submitDisabled={!canSend}
          labels={inputLabels}
        />
      </div>
    </div>
  );
};
