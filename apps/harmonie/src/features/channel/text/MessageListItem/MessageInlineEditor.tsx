import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { EmojiTextarea, IconButton } from '@harmonie/ui';

const MAX_LENGTH = 4000;

interface MessageInlineEditorProps {
  initialValue: string;
  onCancel: () => void;
  onSave: (content: string) => Promise<void>;
}

export const MessageInlineEditor = ({
  initialValue,
  onCancel,
  onSave,
}: MessageInlineEditorProps) => {
  const { t } = useTranslation();
  const [content, setContent] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trimmedContent = content.trim();
  const isOverLimit = content.length > MAX_LENGTH;

  useEffect(() => {
    setContent(initialValue);
    setError(undefined);
  }, [initialValue]);

  useEffect(() => {
    const textarea = wrapperRef.current?.querySelector('textarea');
    if (!textarea) return;
    textarea.focus();
    const cursorPosition = textarea.value.length;
    textarea.setSelectionRange(cursorPosition, cursorPosition);
    textarea.style.height = 'auto';
    const maxHeight = Math.floor(window.innerHeight / 2);
    const next = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${next}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [content]);

  const handleCancel = () => {
    setContent(initialValue);
    setError(undefined);
    onCancel();
  };

  const handleSave = async () => {
    if (!trimmedContent || isOverLimit || saving) return;

    setSaving(true);
    setError(undefined);
    try {
      await onSave(trimmedContent);
    } catch {
      setError(t('channel.input.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSave();
    }
  };

  return (
    <div ref={wrapperRef} className="flex items-end gap-2">
      <div className="flex-1">
        <EmojiTextarea
          value={content}
          onChange={setContent}
          placeholder={t('channel.input.editPlaceholder')}
          disabled={saving}
          error={
            isOverLimit
              ? t('channel.input.tooLong', { max: MAX_LENGTH, count: content.length })
              : error
          }
          rows={1}
          onKeyDown={handleKeyDown}
          style={{ paddingBottom: '12px' }}
        />
      </div>
      <div className="flex flex-col items-end gap-1">
        <IconButton
          size="small"
          onClick={handleCancel}
          disabled={saving}
          aria-label={t('channel.input.cancelEdit')}
          title={t('channel.input.cancelEdit')}
        >
          <X size={14} />
        </IconButton>
        <IconButton
          variant="filled"
          size="small"
          onClick={() => void handleSave()}
          disabled={saving || !trimmedContent || isOverLimit}
          aria-label={t('channel.input.saveEdit')}
          title={t('channel.input.saveEdit')}
        >
          <Check size={14} />
        </IconButton>
      </div>
    </div>
  );
};
