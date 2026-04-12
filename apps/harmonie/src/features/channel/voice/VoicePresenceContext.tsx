import { createContext, useContext, type ReactNode } from 'react';
import type { VoiceParticipant, VoiceParticipantInit } from '@/types/voice';
import { useVoiceParticipants } from './useVoiceParticipants';
import { useVoiceRoom } from './useVoiceRoom';

interface VoicePresenceContextValue {
  getParticipants: (channelId: string) => VoiceParticipant[];
  seedFromChannelList: (
    channels: { channelId: string; participants: VoiceParticipantInit[] | null | undefined }[]
  ) => void;
  activeChannelId: string | null;
  activeChannelName: string | null;
  activeGuildId: string | null;
  activeGuildName: string | null;
  ping: number | null;
  updateActiveChannelMeta: (channelName: string, guildName: string) => void;
  isMuted: boolean;
  speakingUserIds: Set<string>;
  joinChannel: (
    channelId: string,
    channelName?: string,
    guildId?: string,
    guildName?: string
  ) => Promise<void>;
  leaveChannel: () => void;
  toggleMute: () => void;
  isJoining: boolean;
  joinError: string | null;
}

const VoicePresenceContext = createContext<VoicePresenceContextValue>({
  getParticipants: () => [],
  seedFromChannelList: () => {},
  activeChannelId: null,
  activeChannelName: null,
  activeGuildId: null,
  activeGuildName: null,
  ping: null,
  updateActiveChannelMeta: () => {},
  isMuted: false,
  speakingUserIds: new Set(),
  joinChannel: async () => {},
  leaveChannel: () => {},
  toggleMute: () => {},
  isJoining: false,
  joinError: null,
});

export const VoicePresenceProvider = ({ children }: { children: ReactNode }) => {
  const {
    getParticipants,
    seedParticipantsFromJoin,
    seedFromChannelList,
    syncParticipantsFromRoom,
  } = useVoiceParticipants();
  const {
    activeChannelId,
    activeChannelName,
    activeGuildId,
    activeGuildName,
    ping,
    updateActiveChannelMeta,
    isMuted,
    isJoining,
    joinError,
    speakingUserIds,
    joinChannel,
    leaveChannel,
    toggleMute,
  } = useVoiceRoom({ seedParticipantsFromJoin, syncParticipantsFromRoom });

  return (
    <VoicePresenceContext.Provider
      value={{
        getParticipants,
        seedFromChannelList,
        activeChannelId,
        activeChannelName,
        activeGuildId,
        activeGuildName,
        ping,
        updateActiveChannelMeta,
        isMuted,
        speakingUserIds,
        joinChannel,
        leaveChannel,
        toggleMute,
        isJoining,
        joinError,
      }}
    >
      {children}
    </VoicePresenceContext.Provider>
  );
};

export const useVoicePresence = () => useContext(VoicePresenceContext);
