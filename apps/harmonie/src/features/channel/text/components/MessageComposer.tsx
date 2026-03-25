import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SendHorizonal } from 'lucide-react';
import { EmojiTextarea, IconButton } from '@harmonie/ui';
import { sendMessage } from '@/api/channels';
import type { Message } from '@/types/channel';
import type { HubConnection } from '@microsoft/signalr';

const MAX_LENGTH = 4000;
const TYPING_THROTTLE_MS = 4000;

interface MessageComposerProps {
  channelId: string;
  latestEditableMessage?: Message | null;
  onEditingRequested?: (messageId: string) => void;
  connection?: HubConnection | null;
}

export const MessageComposer = ({
  channelId,
  latestEditableMessage = null,
  onEditingRequested,
  connection,
}: MessageComposerProps) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastTypingSentRef = useRef<number>(0);

  const isOverLimit = content.length > MAX_LENGTH;
  const trimmedContent = content.trim();

  useEffect(() => {
    wrapperRef.current?.querySelector('textarea')?.focus();
  }, [channelId]);

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

  const handleChange = (value: string) => {
    setContent(value);
    if (connection && value.trim()) {
      const now = Date.now();
      if (now - lastTypingSentRef.current > TYPING_THROTTLE_MS) {
        lastTypingSentRef.current = now;
        connection.send('StartTypingChannel', channelId).catch(() => {});
      }
    }
  };

  const submit = async () => {
    if (!trimmedContent || sending || isOverLimit) return;

    setSending(true);
    setError(undefined);

    try {
      await sendMessage(channelId, trimmedContent);
      setContent('');
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

  return (
    <div className="flex w-full items-end gap-2 pt-2 self-end">
      <div ref={wrapperRef} className="flex-1">
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
          style={{ paddingBottom: '12px' }}
        />
      </div>
      <div className="flex flex-col items-end gap-1">
        <IconButton
          variant="primary"
          size="medium"
          onClick={() => void submit()}
          disabled={sending || !trimmedContent || isOverLimit}
          aria-label={t('channel.input.send')}
          title={t('channel.input.send')}
        >
          <SendHorizonal size={16} />
        </IconButton>
      </div>
    </div>
  );
};
