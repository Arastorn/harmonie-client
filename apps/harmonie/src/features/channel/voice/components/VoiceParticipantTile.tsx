import { useTranslation } from 'react-i18next';
import { Pin, PinOff } from 'lucide-react';
import { IconButton, VoiceParticipantCard } from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { getUserGradient } from '@/shared/utils/user';
import type { VoiceCardSizes, VoiceParticipantCardData } from '../layout/voiceLayout';

interface VoiceParticipantTileProps {
  card: VoiceParticipantCardData;
  cardSizes: VoiceCardSizes;
  isDarkTheme: boolean;
  cardWidth?: string;
  isSpeaking: boolean;
  isPinned: boolean;
  onTogglePin: () => void;
}

export const VoiceParticipantTile = ({
  card,
  cardSizes,
  isDarkTheme,
  cardWidth,
  isSpeaking,
  isPinned,
  onTogglePin,
}: VoiceParticipantTileProps) => {
  const { t } = useTranslation();
  const avatarUrl = useFileBlobUrl(card.avatarFileId);

  return (
    <div className="group relative min-w-0 flex-none" style={{ width: cardWidth }}>
      <VoiceParticipantCard
        className="h-full min-h-[11rem] w-full"
        avatarSize={cardSizes.avatarSize}
        titleClassName={cardSizes.titleClassName}
        avatarUrl={avatarUrl}
        avatarIcon={card.avatarIcon ?? undefined}
        avatarColor={card.avatarColor ?? undefined}
        avatarBg={card.avatarBg ?? undefined}
        avatarLabel={card.label[0]?.toUpperCase() ?? '?'}
        title={card.label}
        isSpeaking={isSpeaking}
        style={{
          background: getUserGradient(card.userId, isDarkTheme),
        }}
      />
      <div className="absolute right-3 top-3 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
        <IconButton
          size="small"
          variant="filled"
          selected={isPinned}
          onClick={onTogglePin}
          aria-label={isPinned ? t('voice.unpinParticipant') : t('voice.pinParticipant')}
          title={isPinned ? t('voice.unpinParticipant') : t('voice.pinParticipant')}
        >
          {isPinned ? <PinOff size={15} /> : <Pin size={15} />}
        </IconButton>
      </div>
    </div>
  );
};
