import { useCallback, useEffect, useState } from 'react';
import type { Room } from 'livekit-client';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
import type {
  VoiceParticipant,
  VoiceParticipantInit,
  VoiceParticipantJoinedEvent,
  VoiceParticipantLeftEvent,
} from '@/types/voice';
import type { UserProfileUpdatedEvent } from '@/types/user';
import { applyVoiceParticipantProfileUpdate } from '@/features/realtime/userProfileRealtime';

export const useVoiceParticipants = () => {
  const { connection } = useRealtime();
  const [participants, setParticipants] = useState<Map<string, VoiceParticipant[]>>(new Map());

  // Seed from join response (full avatar data available)
  const seedParticipantsFromJoin = useCallback(
    (channelId: string, initial: VoiceParticipantInit[]) => {
      setParticipants((prev) => {
        const next = new Map(prev);
        next.set(
          channelId,
          initial.map((p) => ({ ...p }))
        );
        return next;
      });
    },
    []
  );

  // Seed from guild channel list (initial snapshot, skips channels already populated)
  const seedFromChannelList = useCallback(
    (
      channels: { channelId: string; participants: VoiceParticipantInit[] | null | undefined }[]
    ) => {
      setParticipants((prev) => {
        const next = new Map(prev);
        for (const { channelId, participants } of channels) {
          if (!participants || participants.length === 0) continue;
          if (next.has(channelId)) continue;
          next.set(
            channelId,
            participants.map((p) => ({ ...p }))
          );
        }
        return next;
      });
    },
    []
  );

  // Sync from LiveKit room state, preserving avatar data from SignalR/join
  const syncParticipantsFromRoom = useCallback((channelId: string, room: Room) => {
    setParticipants((prev) => {
      const next = new Map(prev);
      const existingById = new Map((next.get(channelId) ?? []).map((p) => [p.userId, p]));
      const remoteParticipants: VoiceParticipant[] = Array.from(
        room.remoteParticipants.values()
      ).map((participant) => {
        const existing = existingById.get(participant.identity);
        return {
          userId: participant.identity,
          username: existing?.username ?? participant.name?.trim() ?? participant.identity,
          displayName: existing?.displayName ?? null,
          avatarFileId: existing?.avatarFileId ?? null,
          avatarBg: existing?.avatarBg ?? null,
          avatarColor: existing?.avatarColor ?? null,
          avatarIcon: existing?.avatarIcon ?? null,
        };
      });
      next.set(channelId, remoteParticipants);
      return next;
    });
  }, []);

  // Listen to SignalR presence events
  useEffect(() => {
    if (!connection) return;

    const handleJoined = (event: VoiceParticipantJoinedEvent) => {
      setParticipants((prev) => {
        const next = new Map(prev);
        const current = next.get(event.channelId) ?? [];
        const incoming: VoiceParticipant = {
          userId: event.userId,
          username: event.username,
          displayName: event.displayName,
          avatarFileId: event.avatarFileId,
          avatarBg: event.avatarBg,
          avatarColor: event.avatarColor,
          avatarIcon: event.avatarIcon,
        };
        const existingIndex = current.findIndex((p) => p.userId === event.userId);
        if (existingIndex === -1) {
          next.set(event.channelId, [...current, incoming]);
        } else {
          const updated = [...current];
          updated[existingIndex] = incoming;
          next.set(event.channelId, updated);
        }
        return next;
      });
    };

    const handleLeft = (event: VoiceParticipantLeftEvent) => {
      setParticipants((prev) => {
        const next = new Map(prev);
        const current = next.get(event.channelId) ?? [];
        next.set(
          event.channelId,
          current.filter((p) => p.userId !== event.userId)
        );
        return next;
      });
    };

    const handleUserProfileUpdated = (event: UserProfileUpdatedEvent) => {
      setParticipants((prev) => {
        let changed = false;
        const next = new Map<string, VoiceParticipant[]>();
        prev.forEach((participants, channelId) => {
          next.set(
            channelId,
            participants.map((participant) => {
              if (participant.userId !== event.userId) return participant;
              changed = true;
              return applyVoiceParticipantProfileUpdate(participant, event);
            })
          );
        });
        return changed ? next : prev;
      });
    };

    connection.on(REALTIME_SERVER_EVENTS.voiceParticipantJoined, handleJoined);
    connection.on(REALTIME_SERVER_EVENTS.voiceParticipantLeft, handleLeft);
    connection.on(REALTIME_SERVER_EVENTS.userProfileUpdated, handleUserProfileUpdated);

    return () => {
      connection.off(REALTIME_SERVER_EVENTS.voiceParticipantJoined, handleJoined);
      connection.off(REALTIME_SERVER_EVENTS.voiceParticipantLeft, handleLeft);
      connection.off(REALTIME_SERVER_EVENTS.userProfileUpdated, handleUserProfileUpdated);
    };
  }, [connection]);

  const getParticipants = useCallback(
    (channelId: string): VoiceParticipant[] => participants.get(channelId) ?? [],
    [participants]
  );

  return {
    getParticipants,
    seedParticipantsFromJoin,
    seedFromChannelList,
    syncParticipantsFromRoom,
  };
};
