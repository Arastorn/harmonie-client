import { useTranslation } from 'react-i18next';
import { Volume2 } from 'lucide-react';
import type { VoiceScreenShare } from '@/types/voice';
import { ScreenShareTile } from '../components/ScreenShareTile';
import { VoiceCallControls } from '../components/VoiceCallControls';
import { VoiceParticipantTile } from '../components/VoiceParticipantTile';
import { getPinTargetId, type VoiceCardSizes, type VoiceParticipantCardData } from './voiceLayout';

interface VoiceActiveStageProps {
  cards: VoiceParticipantCardData[];
  rows: VoiceParticipantCardData[][];
  cardSizes: VoiceCardSizes;
  cardWidth: string;
  isDarkTheme: boolean;
  speakingUserIds: Set<string>;
  screenShares: VoiceScreenShare[];
  labelsByUserId: Map<string, string>;
  activePinnedTargetId: string | null;
  pinnedParticipant?: VoiceParticipantCardData;
  pinnedScreenShare?: VoiceScreenShare;
  hasPinnedItem: boolean;
  isMuted: boolean;
  isScreenSharing: boolean;
  screenShareError: string | null;
  onTogglePin: (targetId: string) => void;
  onToggleMute: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
}

export const VoiceActiveStage = ({
  cards,
  rows,
  cardSizes,
  cardWidth,
  isDarkTheme,
  speakingUserIds,
  screenShares,
  labelsByUserId,
  activePinnedTargetId,
  pinnedParticipant,
  pinnedScreenShare,
  hasPinnedItem,
  isMuted,
  isScreenSharing,
  screenShareError,
  onTogglePin,
  onToggleMute,
  onToggleScreenShare,
  onLeave,
}: VoiceActiveStageProps) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-1 overflow-hidden px-4 pb-28 pt-6 md:px-6 md:pb-28 md:pt-6">
        <div className="flex h-full w-full items-center justify-center">
          {cards.length === 0 ? (
            <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-md border border-border-2 bg-surface-2 px-8 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-fg">
                <Volume2 size={26} />
              </div>
              <span className="text-sm font-medium text-primary">{t('voice.connected')}</span>
              <p className="text-sm text-text-2">{t('voice.empty')}</p>
            </div>
          ) : hasPinnedItem ? (
            <PinnedVoiceStage
              cards={cards}
              isDarkTheme={isDarkTheme}
              speakingUserIds={speakingUserIds}
              screenShares={screenShares}
              labelsByUserId={labelsByUserId}
              pinnedParticipant={pinnedParticipant}
              pinnedScreenShare={pinnedScreenShare}
              onTogglePin={onTogglePin}
            />
          ) : (
            <VoiceGridStage
              rows={rows}
              cardSizes={cardSizes}
              cardWidth={cardWidth}
              isDarkTheme={isDarkTheme}
              speakingUserIds={speakingUserIds}
              screenShares={screenShares}
              labelsByUserId={labelsByUserId}
              activePinnedTargetId={activePinnedTargetId}
              onTogglePin={onTogglePin}
            />
          )}
        </div>
      </div>

      <VoiceCallControls
        isMuted={isMuted}
        isScreenSharing={isScreenSharing}
        screenShareError={screenShareError}
        onToggleMute={onToggleMute}
        onToggleScreenShare={onToggleScreenShare}
        onLeave={onLeave}
      />
    </>
  );
};

interface PinnedVoiceStageProps {
  cards: VoiceParticipantCardData[];
  isDarkTheme: boolean;
  speakingUserIds: Set<string>;
  screenShares: VoiceScreenShare[];
  labelsByUserId: Map<string, string>;
  pinnedParticipant?: VoiceParticipantCardData;
  pinnedScreenShare?: VoiceScreenShare;
  onTogglePin: (targetId: string) => void;
}

const PinnedVoiceStage = ({
  cards,
  isDarkTheme,
  speakingUserIds,
  screenShares,
  labelsByUserId,
  pinnedParticipant,
  pinnedScreenShare,
  onTogglePin,
}: PinnedVoiceStageProps) => (
  <div className="flex h-full w-full flex-col gap-4">
    <div className="min-h-0 flex-1">
      {pinnedScreenShare ? (
        <ScreenShareTile
          screenShare={pinnedScreenShare}
          label={
            labelsByUserId.get(pinnedScreenShare.participantId) ?? pinnedScreenShare.participantId
          }
          isPinned
          onTogglePin={() => onTogglePin(getPinTargetId('screenShare', pinnedScreenShare.trackSid))}
          className="h-full w-full"
        />
      ) : pinnedParticipant ? (
        <VoiceParticipantTile
          card={pinnedParticipant}
          cardSizes={{ avatarSize: 128, titleClassName: 'text-4xl' }}
          isDarkTheme={isDarkTheme}
          cardWidth="100%"
          isSpeaking={speakingUserIds.has(pinnedParticipant.userId)}
          isPinned
          onTogglePin={() => onTogglePin(getPinTargetId('participant', pinnedParticipant.userId))}
        />
      ) : null}
    </div>

    <div className="shrink-0 overflow-x-auto pb-1">
      <div className="flex min-w-full justify-center gap-3">
        {screenShares
          .filter((screenShare) => screenShare.trackSid !== pinnedScreenShare?.trackSid)
          .map((screenShare) => (
            <ScreenShareTile
              key={screenShare.trackSid}
              screenShare={screenShare}
              label={labelsByUserId.get(screenShare.participantId) ?? screenShare.participantId}
              isPinned={false}
              onTogglePin={() => onTogglePin(getPinTargetId('screenShare', screenShare.trackSid))}
              className="h-36 w-72 shrink-0"
            />
          ))}
        {cards
          .filter((card) => card.userId !== pinnedParticipant?.userId)
          .map((card) => (
            <VoiceParticipantTile
              key={card.userId}
              card={card}
              cardSizes={{ avatarSize: 48, titleClassName: 'text-sm' }}
              isDarkTheme={isDarkTheme}
              cardWidth="10rem"
              isSpeaking={speakingUserIds.has(card.userId)}
              isPinned={false}
              onTogglePin={() => onTogglePin(getPinTargetId('participant', card.userId))}
            />
          ))}
      </div>
    </div>
  </div>
);

interface VoiceGridStageProps {
  rows: VoiceParticipantCardData[][];
  cardSizes: VoiceCardSizes;
  cardWidth: string;
  isDarkTheme: boolean;
  speakingUserIds: Set<string>;
  screenShares: VoiceScreenShare[];
  labelsByUserId: Map<string, string>;
  activePinnedTargetId: string | null;
  onTogglePin: (targetId: string) => void;
}

const VoiceGridStage = ({
  rows,
  cardSizes,
  cardWidth,
  isDarkTheme,
  speakingUserIds,
  screenShares,
  labelsByUserId,
  activePinnedTargetId,
  onTogglePin,
}: VoiceGridStageProps) => (
  <div className="flex h-full w-full justify-center">
    <div className="flex h-full w-full flex-col gap-6">
      {screenShares.length > 0 && (
        <div className="grid min-h-[20rem] flex-[2.5] grid-cols-1 gap-6 lg:grid-cols-2">
          {screenShares.map((screenShare) => (
            <ScreenShareTile
              key={screenShare.trackSid}
              screenShare={screenShare}
              label={labelsByUserId.get(screenShare.participantId) ?? screenShare.participantId}
              isPinned={
                activePinnedTargetId === getPinTargetId('screenShare', screenShare.trackSid)
              }
              onTogglePin={() => onTogglePin(getPinTargetId('screenShare', screenShare.trackSid))}
              className="min-h-[20rem]"
            />
          ))}
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        {rows.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex flex-1 w-full justify-center gap-6">
            {row.map((card) => (
              <VoiceParticipantTile
                key={card.userId}
                card={card}
                cardSizes={cardSizes}
                isDarkTheme={isDarkTheme}
                cardWidth={cardWidth}
                isSpeaking={speakingUserIds.has(card.userId)}
                isPinned={activePinnedTargetId === getPinTargetId('participant', card.userId)}
                onTogglePin={() => onTogglePin(getPinTargetId('participant', card.userId))}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);
