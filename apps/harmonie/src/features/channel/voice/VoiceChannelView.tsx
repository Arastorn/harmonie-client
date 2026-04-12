import { useEffect, useRef } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react';
import { Button, IconButton, VoiceParticipantCard } from '@harmonie/ui';
import { useChannels } from '@/features/channel/ChannelContext';
import { useCurrentGuild } from '@/features/guild/GuildContext';
import { useTheme } from '@/features/user/ThemeContext';
import { useUser } from '@/features/user/UserContext';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { getUserGradient } from '@/shared/utils/user';
import type { VoiceParticipant } from '@/types/voice';
import { useVoicePresence } from './VoicePresenceContext';

interface Card {
  kind: 'participant';
  userId: string;
  label: string;
  avatarFileId: string | null;
  avatarIcon: string | null;
  avatarColor: string | null;
  avatarBg: string | null;
}

function getParticipantLabel(
  participant: Pick<VoiceParticipant, 'userId' | 'username' | 'displayName'>
): string {
  const trimmedDisplay = participant.displayName?.trim();
  if (trimmedDisplay) return trimmedDisplay;
  const trimmedUsername = participant.username?.trim();
  return trimmedUsername || participant.userId;
}

function getCardSizes(totalCardCount: number): {
  avatarSize: number;
  titleClassName: string;
} {
  if (totalCardCount <= 2) return { avatarSize: 112, titleClassName: 'text-3xl' };
  if (totalCardCount <= 4) return { avatarSize: 96, titleClassName: 'text-2xl' };
  return { avatarSize: 80, titleClassName: 'text-xl' };
}

function getParticipantRows<T>(participants: T[]): T[][] {
  const count = participants.length;
  if (count === 0) return [];

  const numRows = count <= 3 ? 1 : count <= 8 ? 2 : 3;

  const base = Math.floor(count / numRows);
  const extra = count % numRows;

  let startIndex = 0;
  return Array.from({ length: numRows }, (_, i) => {
    const rowSize = i < extra ? base + 1 : base;
    const row = participants.slice(startIndex, startIndex + rowSize);
    startIndex += rowSize;
    return row;
  });
}

interface ParticipantCardItemProps {
  card: Card;
  cardSizes: ReturnType<typeof getCardSizes>;
  isDarkTheme: boolean;
  cardWidth: string;
  isSpeaking: boolean;
}

const ParticipantCardItem = ({
  card,
  cardSizes,
  isDarkTheme,
  cardWidth,
  isSpeaking,
}: ParticipantCardItemProps) => {
  const avatarUrl = useFileBlobUrl(card.avatarFileId);

  return (
    <VoiceParticipantCard
      className="min-w-0 flex-none"
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
        width: cardWidth,
        background: getUserGradient(card.userId, isDarkTheme),
      }}
    />
  );
};

export const VoiceChannelView = () => {
  const { t } = useTranslation();
  const { channelId, guildId } = useParams<{ channelId: string; guildId: string }>();
  const { channels } = useChannels();
  const { guild } = useCurrentGuild();
  const { theme } = useTheme();
  const { user } = useUser();
  const {
    getParticipants,
    activeChannelId,
    activeChannelName,
    isMuted,
    speakingUserIds,
    joinChannel,
    leaveChannel,
    toggleMute,
    isJoining,
    joinError,
    updateActiveChannelMeta,
  } = useVoicePresence();

  const channel = channels?.find((c) => c.channelId === channelId);
  const isActive = activeChannelId === channelId;

  const joinMetaRef = useRef({ channel, guild, isActive, isJoining, joinChannel });
  joinMetaRef.current = { channel, guild, isActive, isJoining, joinChannel };

  useEffect(() => {
    if (!channelId || !guildId) return;
    const {
      channel: ch,
      guild: g,
      isActive: active,
      isJoining: joining,
      joinChannel: join,
    } = joinMetaRef.current;
    if (!active && !joining) {
      void join(channelId, ch?.name, guildId, g?.name);
    }
  }, [channelId, guildId]);

  useEffect(() => {
    if (isActive && channel?.name && guild?.name && !activeChannelName) {
      updateActiveChannelMeta(channel.name, guild.name);
    }
  }, [isActive, channel?.name, guild?.name, activeChannelName, updateActiveChannelMeta]);

  if (!channelId || !guildId) return <Navigate to="/" replace />;

  const participants = getParticipants(channelId);
  const isDarkTheme = theme.endsWith('obsidian');

  const visibleParticipants: VoiceParticipant[] =
    isActive && user
      ? [
          {
            userId: user.userId,
            username: user.username,
            displayName: user.displayName ?? null,
            avatarFileId: user.avatarFileId ?? null,
            avatarBg: user.avatar?.bg ?? null,
            avatarColor: user.avatar?.color ?? null,
            avatarIcon: user.avatar?.icon ?? null,
          },
          ...participants.filter((p) => p.userId !== user.userId),
        ]
      : participants;

  const cards: Card[] = visibleParticipants.map((participant) => ({
    kind: 'participant' as const,
    userId: participant.userId,
    label: getParticipantLabel(participant),
    avatarFileId: participant.avatarFileId,
    avatarIcon: participant.avatarIcon,
    avatarColor: participant.avatarColor,
    avatarBg: participant.avatarBg,
  }));

  const rows = getParticipantRows(cards);
  const totalDisplayedCardCount = cards.length;
  const cardSizes = getCardSizes(totalDisplayedCardCount);
  const maxCols = Math.max(...rows.map((r) => r.length));
  const cardWidth = `calc((100% - ${(maxCols - 1) * 1.5}rem) / ${maxCols})`;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md bg-surface-1">
      <header className="flex shrink-0 items-center justify-between px-4 h-14 bg-surface-2 rounded-t-md">
        <div className="flex items-center gap-2 min-w-0">
          <Volume2 size={16} className="shrink-0 text-text-3" />
          <span className="text-sm font-semibold text-text-1 truncate">
            {channel?.name ?? channelId}
          </span>
        </div>
      </header>

      <div className="relative flex flex-1 flex-col overflow-hidden bg-surface-1">
        {isActive ? (
          <>
            <div className="flex flex-1 overflow-hidden px-6 pb-32 pt-10 md:px-10 md:pb-32 md:pt-10">
              <div className="flex h-full w-full items-center justify-center">
                {visibleParticipants.length === 0 ? (
                  <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-md border border-border-2 bg-surface-2 px-8 py-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-fg">
                      <Volume2 size={26} />
                    </div>
                    <span className="text-sm font-medium text-primary">{t('voice.connected')}</span>
                    <p className="text-sm text-text-2">{t('voice.empty')}</p>
                  </div>
                ) : (
                  <div className="flex h-full w-full justify-center">
                    <div className="flex h-full w-full max-w-7xl flex-col gap-6">
                      {rows.map((row, rowIndex) => (
                        <div
                          key={`row-${rowIndex}`}
                          className="flex flex-1 w-full justify-center gap-6"
                        >
                          {row.map((card) => (
                            <ParticipantCardItem
                              key={card.userId}
                              card={card}
                              cardSizes={cardSizes}
                              isDarkTheme={isDarkTheme}
                              cardWidth={cardWidth}
                              isSpeaking={speakingUserIds.has(card.userId)}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-6 pt-16">
              <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border-2 bg-surface-1 px-3 py-3 shadow-[0_4px_16px_rgba(61,53,48,0.10)]">
                <IconButton
                  size="medium"
                  variant={isMuted ? 'danger' : 'filled'}
                  onClick={toggleMute}
                  aria-label={isMuted ? t('voice.unmute') : t('voice.mute')}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </IconButton>

                <div className="hidden h-10 w-px bg-border-2 sm:block" />

                <Button
                  variant="danger"
                  onClick={leaveChannel}
                  aria-label={t('voice.leave')}
                  className="rounded-full px-5"
                >
                  <PhoneOff size={18} />
                  <span>{t('voice.leave')}</span>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 py-8">
            <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-md border border-border-2 bg-surface-2 px-8 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-fg">
                <Volume2 size={28} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-text-1">{channel?.name ?? channelId}</h2>
                <p className="text-sm text-text-3">
                  {isJoining
                    ? t('voice.joining')
                    : joinError
                      ? t(joinError)
                      : t('voice.readyToJoin')}
                </p>
              </div>

              {!isJoining ? (
                <Button
                  variant="primary"
                  onClick={() => void joinChannel(channelId, channel?.name, guildId, guild?.name)}
                  disabled={isJoining}
                  aria-label={t('voice.join')}
                >
                  <Volume2 size={16} />
                  {t('voice.join')}
                </Button>
              ) : (
                <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-primary/60" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
