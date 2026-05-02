import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { IconButton, RichTextMessageInput } from '@harmonie/ui';
import { useMessageFormattingPreference } from '../hooks/useMessageFormattingPreference';
import { getMessagePayloadContent, stripHtmlToText } from '../utils/messageHtml';
import { getRichTextMessageInputLabels } from '../utils/richTextMessageInputLabels';

const MAX_LENGTH = 4000;

interface MessageInlineEditorProps {
  initialValue: string | null;
  onCancel: () => void;
  onSave: (content: string) => Promise<void>;
}

export const MessageInlineEditor = ({
  initialValue,
  onCancel,
  onSave,
}: MessageInlineEditorProps) => {
  const { t } = useTranslation();
  const [content, setContent] = useState(initialValue ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const { formattingOpen, toggleFormattingOpen } = useMessageFormattingPreference();
  const inputLabels = getRichTextMessageInputLabels(t);
  const textContent = stripHtmlToText(content);
  const payloadContent = getMessagePayloadContent(content);
  const trimmedContent = textContent.trim();
  const isOverLimit = payloadContent.length > MAX_LENGTH;

  useEffect(() => {
    setContent(initialValue ?? '');
    setError(undefined);
  }, [initialValue]);
  const handleCancel = () => {
    setContent(initialValue ?? '');
    setError(undefined);
    onCancel();
  };

  const handleSave = async () => {
    if (!trimmedContent || isOverLimit || saving) return;

    setSaving(true);
    setError(undefined);
    try {
      await onSave(payloadContent);
    } catch {
      setError(t('channel.input.updateError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <RichTextMessageInput
          value={content}
          onChange={setContent}
          placeholder={t('channel.input.editPlaceholder')}
          disabled={saving}
          error={
            isOverLimit
              ? t('channel.input.tooLong', { max: MAX_LENGTH, count: payloadContent.length })
              : error
          }
          onSubmit={() => void handleSave()}
          showSubmitButton={false}
          showFormattingTools={formattingOpen}
          onToggleFormattingTools={toggleFormattingOpen}
          labels={inputLabels}
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
