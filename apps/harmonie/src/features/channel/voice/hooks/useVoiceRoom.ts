import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, type Participant } from 'livekit-client';
import { joinVoiceChannel } from '@/api/channels';
import { useAudioInput } from '@/features/user/audio/AudioInputContext';
import { useAudioOutput } from '@/features/user/audio/AudioOutputContext';
import type { VoiceParticipantInit, VoiceScreenShare } from '@/types/voice';
import { buildIceServers, getJoinErrorKey, hasRelayServer } from '../voiceUtils';

interface UseVoiceRoomParams {
  seedParticipantsFromJoin: (channelId: string, initial: VoiceParticipantInit[]) => void;
  syncParticipantsFromRoom: (channelId: string, room: Room) => void;
}

export const useVoiceRoom = ({
  seedParticipantsFromJoin,
  syncParticipantsFromRoom,
}: UseVoiceRoomParams) => {
  const {
    selectedDeviceId: selectedInputDeviceId,
    muted: inputMuted,
    setMuted: setInputMuted,
  } = useAudioInput();
  const { applySinkId, muted: outputMuted } = useAudioOutput();

  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeChannelName, setActiveChannelName] = useState<string | null>(null);
  const [activeGuildId, setActiveGuildId] = useState<string | null>(null);
  const [activeGuildName, setActiveGuildName] = useState<string | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [speakingUserIds, setSpeakingUserIds] = useState<Set<string>>(new Set());
  const [screenShares, setScreenShares] = useState<VoiceScreenShare[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);

  const roomRef = useRef<Room | null>(null);
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const upsertScreenShare = useCallback((screenShare: VoiceScreenShare) => {
    setScreenShares((prev) => {
      const existingIndex = prev.findIndex((share) => share.trackSid === screenShare.trackSid);
      if (existingIndex === -1) return [...prev, screenShare];

      const next = [...prev];
      next[existingIndex] = screenShare;
      return next;
    });
  }, []);

  const removeScreenShare = useCallback((trackSid: string) => {
    setScreenShares((prev) => prev.filter((share) => share.trackSid !== trackSid));
  }, []);

  const disconnectRoom = useCallback(async () => {
    remoteAudioElementsRef.current.forEach((audioEl) => {
      audioEl.pause();
      audioEl.srcObject = null;
      audioEl.remove();
    });
    remoteAudioElementsRef.current.clear();

    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    setActiveChannelId(null);
    setActiveChannelName(null);
    setActiveGuildId(null);
    setActiveGuildName(null);
    setPing(null);
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    setIsMuted(false);
    setSpeakingUserIds(new Set());
    setScreenShares([]);
    setIsScreenSharing(false);
    setScreenShareError(null);
  }, []);

  const leaveChannel = useCallback(() => {
    void disconnectRoom();
  }, [disconnectRoom]);

  const joinChannel = useCallback(
    async (channelId: string, channelName?: string, guildId?: string, guildName?: string) => {
      setJoinError(null);
      setIsJoining(true);
      try {
        await disconnectRoom();

        const { token, url, iceServers, currentParticipants } = await joinVoiceChannel(channelId);
        if (currentParticipants && currentParticipants.length > 0) {
          seedParticipantsFromJoin(channelId, currentParticipants);
        }
        const resolvedIceServers = buildIceServers(iceServers);

        if (resolvedIceServers && !hasRelayServer(resolvedIceServers)) {
          console.warn(
            '[Voice] No TURN relay configured. ICE may fail on many production networks.'
          );
        }

        const room = new Room();

        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === Track.Kind.Video && publication.source === Track.Source.ScreenShare) {
            upsertScreenShare({
              participantId: participant.identity,
              trackSid: publication.trackSid,
              track,
              isLocal: false,
            });
            return;
          }

          if (track.kind !== Track.Kind.Audio) return;

          const audioElement = track.attach() as HTMLAudioElement;
          audioElement.autoplay = true;
          audioElement.dataset.participantId = participant.identity;
          audioElement.dataset.trackSid = publication.trackSid;
          audioElement.muted = outputMuted;
          applySinkId(audioElement);
          remoteAudioElementsRef.current.set(publication.trackSid, audioElement);

          void audioElement.play().catch((error) => {
            console.error('[Voice] Failed to play remote audio track', {
              channelId,
              participantIdentity: participant.identity,
              trackSid: publication.trackSid,
              error,
            });
          });
        });

        room.on(RoomEvent.TrackUnsubscribed, (track, publication) => {
          if (track.kind === Track.Kind.Video && publication.source === Track.Source.ScreenShare) {
            removeScreenShare(publication.trackSid);
            return;
          }

          if (track.kind !== Track.Kind.Audio) return;

          const audioElement = remoteAudioElementsRef.current.get(publication.trackSid);
          if (audioElement) {
            track.detach(audioElement);
            audioElement.remove();
            remoteAudioElementsRef.current.delete(publication.trackSid);
          }
        });

        room.on(RoomEvent.TrackSubscriptionFailed, (trackSid, participant, error) => {
          console.error('[Voice] Remote track subscription failed', {
            channelId,
            participantIdentity: participant.identity,
            trackSid,
            error,
          });
        });

        room.on(RoomEvent.TrackUnpublished, (publication) => {
          if (publication.source !== Track.Source.ScreenShare) return;
          removeScreenShare(publication.trackSid);
        });

        room.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
          if (
            publication.source !== Track.Source.ScreenShare ||
            publication.kind !== Track.Kind.Video ||
            !publication.track
          ) {
            return;
          }

          upsertScreenShare({
            participantId: participant.identity,
            trackSid: publication.trackSid,
            track: publication.track,
            isLocal: true,
          });
          setIsScreenSharing(true);
          setScreenShareError(null);
        });

        room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
          if (publication.source !== Track.Source.ScreenShare) return;
          removeScreenShare(publication.trackSid);
          setIsScreenSharing(false);
        });

        room.on(RoomEvent.ParticipantConnected, () => {
          syncParticipantsFromRoom(channelId, room);
        });
        room.on(RoomEvent.ParticipantDisconnected, () => {
          syncParticipantsFromRoom(channelId, room);
        });
        room.on(RoomEvent.Connected, () => {
          syncParticipantsFromRoom(channelId, room);
        });
        room.on(RoomEvent.Reconnected, () => {
          syncParticipantsFromRoom(channelId, room);
        });

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
          setSpeakingUserIds(new Set(speakers.map((s) => s.identity)));
        });

        room.on(RoomEvent.SignalReconnecting, () => {
          console.warn('[Voice] Signal reconnecting', { channelId });
        });

        room.on(RoomEvent.Reconnecting, () => {
          console.warn('[Voice] Media reconnecting', { channelId });
        });

        room.on(RoomEvent.MediaDevicesError, (error) => {
          console.error('[Voice] Media device error', error);
        });

        room.on(RoomEvent.Disconnected, () => {
          setActiveChannelId(null);
          setIsMuted(false);
          setScreenShares([]);
          setIsScreenSharing(false);
          roomRef.current = null;
        });

        await room.connect(url, token, {
          ...(resolvedIceServers ? { rtcConfig: { iceServers: resolvedIceServers } } : {}),
          peerConnectionTimeout: 30000,
        });
        if (selectedInputDeviceId && selectedInputDeviceId !== 'default') {
          await room.switchActiveDevice('audioinput', selectedInputDeviceId);
        }
        await room.localParticipant.setMicrophoneEnabled(!inputMuted);

        roomRef.current = room;
        setActiveChannelId(channelId);
        setActiveChannelName(channelName ?? null);
        setActiveGuildId(guildId ?? null);
        setActiveGuildName(guildName ?? null);
        setIsMuted(inputMuted);

        const measurePing = async () => {
          const report = await room.engine.pcManager?.publisher.getStats();
          if (!report) return;
          report.forEach((stat) => {
            if (
              stat.type === 'candidate-pair' &&
              stat.state === 'succeeded' &&
              stat.currentRoundTripTime != null
            ) {
              setPing(Math.round(stat.currentRoundTripTime * 1000));
            }
          });
        };
        void measurePing();
        pingIntervalRef.current = setInterval(() => void measurePing(), 3000);
      } catch (err) {
        console.error('[Voice] joinChannel failed:', err);
        setJoinError(getJoinErrorKey(err));
        await disconnectRoom();
      } finally {
        setIsJoining(false);
      }
    },
    [
      applySinkId,
      disconnectRoom,
      inputMuted,
      outputMuted,
      removeScreenShare,
      seedParticipantsFromJoin,
      selectedInputDeviceId,
      syncParticipantsFromRoom,
      upsertScreenShare,
    ]
  );

  const toggleMute = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const nextMuted = !isMuted;
    void room.localParticipant.setMicrophoneEnabled(!nextMuted);
    setInputMuted(nextMuted);
    setIsMuted(nextMuted);
  }, [isMuted, setInputMuted]);

  const toggleScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;

    const nextEnabled = !isScreenSharing;
    setScreenShareError(null);

    try {
      await room.localParticipant.setScreenShareEnabled(nextEnabled);
      setIsScreenSharing(room.localParticipant.isScreenShareEnabled);
    } catch (error) {
      console.error('[Voice] Failed to toggle screen share', { error });
      setScreenShareError('voice.screenShareError');
      setIsScreenSharing(room.localParticipant.isScreenShareEnabled);
    }
  }, [isScreenSharing]);

  // Sync audio input device when it changes
  useEffect(() => {
    const room = roomRef.current;
    if (!room || selectedInputDeviceId === 'default') return;
    void room.switchActiveDevice('audioinput', selectedInputDeviceId).catch((error) => {
      console.error('[Voice] Failed to switch audio input device', {
        deviceId: selectedInputDeviceId,
        error,
      });
    });
  }, [selectedInputDeviceId]);

  // Sync microphone mute state
  useEffect(() => {
    const room = roomRef.current;
    if (!room) return;
    void room.localParticipant.setMicrophoneEnabled(!inputMuted).catch((error) => {
      console.error('[Voice] Failed to sync microphone mute state', { inputMuted, error });
    });
    setIsMuted(inputMuted);
  }, [inputMuted]);

  // Sync output mute state across all remote audio elements
  useEffect(() => {
    remoteAudioElementsRef.current.forEach((audioEl) => {
      audioEl.muted = outputMuted;
      applySinkId(audioEl);
    });
  }, [applySinkId, outputMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      void disconnectRoom();
    };
  }, [disconnectRoom]);

  const updateActiveChannelMeta = useCallback((channelName: string, guildName: string) => {
    setActiveChannelName(channelName);
    setActiveGuildName(guildName);
  }, []);

  return {
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
    screenShares,
    isScreenSharing,
    screenShareError,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleScreenShare,
  };
};
