import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pin, PinOff } from 'lucide-react';
import { IconButton, VoiceParticipantCard } from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { getUserGradient } from '@/shared/utils/user';
import type { VoiceCameraTrack } from '@/types/voice';
import type { VoiceCardSizes, VoiceParticipantCardData } from '../layout/voiceLayout';

interface VoiceParticipantTileProps {
  card: VoiceParticipantCardData;
  cardSizes: VoiceCardSizes;
  isDarkTheme: boolean;
  cardWidth?: string;
  isSpeaking: boolean;
  cameraTrack?: VoiceCameraTrack;
  isPinned: boolean;
  onTogglePin: () => void;
}

export const VoiceParticipantTile = ({
  card,
  cardSizes,
  isDarkTheme,
  cardWidth,
  isSpeaking,
  cameraTrack,
  isPinned,
  onTogglePin,
}: VoiceParticipantTileProps) => {
  const { t } = useTranslation();
  const avatarUrl = useFileBlobUrl(card.avatarFileId);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !cameraTrack) return;

    cameraTrack.track.attach(videoEl);
    return () => {
      cameraTrack.track.detach(videoEl);
    };
  }, [cameraTrack]);

  return (
    <div className="group relative min-w-0 flex-none" style={{ width: cardWidth }}>
      {cameraTrack ? (
        <div
          className={[
            'relative h-full min-h-[11rem] w-full overflow-hidden rounded-md border bg-surface-3 transition-all duration-150 hover:scale-[1.01]',
            isSpeaking
              ? 'border-primary shadow-[inset_0_0_0_2px_var(--color-primary)]'
              : 'border-border-2',
          ].join(' ')}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={cameraTrack.isLocal}
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10">
            <p
              className={[
                'max-w-full truncate font-medium text-white',
                cardSizes.titleClassName,
              ].join(' ')}
            >
              {card.label}
            </p>
          </div>
        </div>
      ) : (
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
      )}
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
