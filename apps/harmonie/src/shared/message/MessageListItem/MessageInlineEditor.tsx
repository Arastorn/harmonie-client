import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { IconButton, RichTextMessageInput, type RichTextMentionOption } from '@harmonie/ui';
import type { ApiError } from '@/types/error';
import { useMessageFormattingPreference } from '../hooks/useMessageFormattingPreference';
import { getMessagePayloadContent, stripHtmlToText } from '../utils/messageHtml';
import { filterMentionedUserIdsFromContent } from '../utils/mentions';
import { getRichTextMessageInputLabels } from '../utils/richTextMessageInputLabels';
import { useCoarsePointer } from '@/shared/hooks/useCoarsePointer';

const MAX_LENGTH = 4000;
const EMPTY_MENTION_IDS: string[] = [];
const EMPTY_MENTION_OPTIONS: RichTextMentionOption[] = [];

interface MessageInlineEditorProps {
  initialValue: string | null;
  initialMentionedUserIds?: string[];
  onCancel: () => void;
  onSave: (content: string, mentionedUserIds: string[]) => Promise<void>;
  mentionOptions?: RichTextMentionOption[];
}

export const MessageInlineEditor = ({
  initialValue,
  initialMentionedUserIds = EMPTY_MENTION_IDS,
  onCancel,
  onSave,
  mentionOptions = EMPTY_MENTION_OPTIONS,
}: MessageInlineEditorProps) => {
  const { t } = useTranslation();
  const [content, setContent] = useState(initialValue ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [selectedMentionIds, setSelectedMentionIds] = useState<Set<string>>(
    () => new Set(initialMentionedUserIds)
  );
  const { formattingOpen, toggleFormattingOpen } = useMessageFormattingPreference();
  const isCoarsePointer = useCoarsePointer();
  const inputLabels = getRichTextMessageInputLabels(t);
  const mentionMap = new Map(mentionOptions.map((mention) => [mention.userId, mention]));
  const textContent = stripHtmlToText(content);
  const payloadContent = getMessagePayloadContent(content);
  const trimmedContent = textContent.trim();
  const isOverLimit = payloadContent.length > MAX_LENGTH;

  useEffect(() => {
    setContent(initialValue ?? '');
    setSelectedMentionIds(new Set(initialMentionedUserIds));
    setError(undefined);
  }, [initialMentionedUserIds, initialValue]);
  const handleCancel = () => {
    setContent(initialValue ?? '');
    setSelectedMentionIds(new Set(initialMentionedUserIds));
    setError(undefined);
    onCancel();
  };

  const handleSave = async () => {
    if (!trimmedContent || isOverLimit || saving) return;

    setSaving(true);
    setError(undefined);
    const mentionedUserIds = filterMentionedUserIdsFromContent(
      content,
      selectedMentionIds,
      mentionMap
    );
    try {
      await onSave(payloadContent, mentionedUserIds);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.code === 'MESSAGE_MENTIONED_USER_NOT_FOUND') {
        setError(t('channel.input.mentionUserNotFound'));
      } else if (apiError.code === 'MESSAGE_MENTIONED_USER_NOT_MEMBER') {
        setError(t('channel.input.mentionUserNotMember'));
      } else {
        setError(t('channel.input.updateError'));
      }
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
          onEscape={handleCancel}
          mentionOptions={mentionOptions}
          onMentionSelected={(mention) =>
            setSelectedMentionIds((current) => new Set(current).add(mention.userId))
          }
          autoFocus={!isCoarsePointer}
          autoFocusPlacement="end"
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
