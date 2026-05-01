import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Paperclip, SendHorizonal, X } from 'lucide-react';
import { EmojiTextarea, IconButton } from '@harmonie/ui';
import { deleteFile, uploadFile } from '@/api/files';
import type { Message } from '@/types/channel';

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
  sendFn: (content: string, attachmentFileIds: string[]) => Promise<unknown>;
  onTypingStart?: () => void;
  latestEditableMessage?: Message | null;
  onEditingRequested?: (messageId: string) => void;
}

export const MessageComposer = ({
  sendFn,
  onTypingStart,
  latestEditableMessage = null,
  onEditingRequested,
}: MessageComposerProps) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTypingSentRef = useRef<number>(0);

  const isOverLimit = content.length > MAX_LENGTH;
  const trimmedContent = content.trim();
  const isUploading = pendingAttachments.some((a) => a.status === 'uploading');
  const doneAttachments = pendingAttachments.filter((a) => a.status === 'done');
  const canSend =
    !sending && !isOverLimit && (!!trimmedContent || (doneAttachments.length > 0 && !isUploading));

  useEffect(() => {
    wrapperRef.current?.querySelector('textarea')?.focus();
  }, []);

  useEffect(() => {
    if (!sending) wrapperRef.current?.querySelector('textarea')?.focus();
  }, [sending]);

  useEffect(() => {
    const textarea = wrapperRef.current?.querySelector('textarea');
    if (!textarea) return;
    textarea.style.height = 'auto';
    const maxHeight = Math.floor(window.innerHeight / 2);
    const next = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${next}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [content]);

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
    if (onTypingStart && value.trim()) {
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

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files);
    if (!files.length) return;
    e.preventDefault();
    addFiles(files);
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
      await sendFn(trimmedContent, attachmentFileIds);
      setContent('');
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'ArrowUp' && !content && latestEditableMessage) {
      e.preventDefault();
      onEditingRequested?.(latestEditableMessage.messageId);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
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
    <div className="flex w-full items-end gap-2 pt-2 self-end">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        ref={wrapperRef}
        className={`flex-1 rounded-md transition-colors ${isDragOver ? 'ring-2 ring-primary' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <EmojiTextarea
          value={content}
          onChange={handleChange}
          placeholder={t('channel.input.placeholder')}
          disabled={sending}
          error={
            isOverLimit
              ? t('channel.input.tooLong', { max: MAX_LENGTH, count: content.length })
              : error
          }
          rows={1}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          style={{ paddingBottom: '12px' }}
          topContent={attachmentsPreview}
          extraActions={
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="flex h-6 w-6 items-center justify-center cursor-pointer rounded text-text-3 transition-colors hover:text-text-1 disabled:opacity-50"
              aria-label={t('channel.input.attachFile')}
              title={t('channel.input.attachFile')}
            >
              <Paperclip size={16} />
            </button>
          }
        />
      </div>

      <div className="h-11.5 flex items-center shrink-0">
        <IconButton
          variant="primary"
          size="medium"
          onClick={() => void submit()}
          disabled={!canSend}
          aria-label={t('channel.input.send')}
          title={t('channel.input.send')}
        >
          <SendHorizonal size={16} />
        </IconButton>
      </div>
    </div>
  );
};
