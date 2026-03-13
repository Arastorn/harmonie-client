import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, IconButton, Input, RadioCard } from '@harmonie/ui';
import { createChannel } from '@/api/guilds';
import type { Channel } from '@/api/guilds';

type ChannelType = 'Text' | 'Voice';

interface CreateChannelModalProps {
  guildId: string;
  defaultType?: ChannelType;
  nextPosition: number;
  onClose: () => void;
  onCreated: (channel: Channel) => void;
}

export const CreateChannelModal = ({
  guildId,
  defaultType = 'Text',
  nextPosition,
  onClose,
  onCreated,
}: CreateChannelModalProps) => {
  const { t } = useTranslation();
  const [type, setType] = useState<ChannelType>(defaultType);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(false);
    try {
      const channel = await createChannel(guildId, {
        name: trimmed,
        type,
        position: nextPosition,
      });
      onCreated(channel);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('guild.channels.create.title')}
    >
      <div
        className="w-full max-w-md rounded-sm border border-border-2 bg-surface-1 p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="font-display italic text-2xl text-text-1">
            {t('guild.channels.create.title')}
          </h2>
          <IconButton
            size="small"
            aria-label={t('guild.channels.create.cancel')}
            onClick={() => onClose()}
          >
            <X size={16} />
          </IconButton>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Type selector */}
          <fieldset className="flex flex-col gap-2">
            <legend className="font-body text-sm font-semibold text-text-1 mb-1">
              {t('guild.channels.create.typeLabel')}
            </legend>
            <RadioCard
              name="channelType"
              value="Text"
              checked={type === 'Text'}
              onChange={(v) => setType(v as ChannelType)}
            >
              {t('guild.channels.create.typeText')}
            </RadioCard>
            <RadioCard
              name="channelType"
              value="Voice"
              checked={type === 'Voice'}
              onChange={(v) => setType(v as ChannelType)}
            >
              {t('guild.channels.create.typeVoice')}
            </RadioCard>
          </fieldset>

          {/* Name */}
          <Input
            label={t('guild.channels.create.nameLabel')}
            placeholder={t('guild.channels.create.namePlaceholder')}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(false);
            }}
            error={error ? t('guild.channels.create.error') : undefined}
            autoFocus
            maxLength={100}
          />

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="tertiary" onClick={onClose}>
              {t('guild.channels.create.cancel')}
            </Button>
            <Button type="submit" isLoading={isLoading} disabled={!name.trim()}>
              {t('guild.channels.create.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
