import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, type Participant } from 'livekit-client';
import { joinVoiceChannel } from '@/api/channels';
import { joinConversationVoiceCall } from '@/api/conversations';
import { useAudioInput } from '@/features/user/audio/AudioInputContext';
import { useAudioOutput } from '@/features/user/audio/AudioOutputContext';
import { useVideoInput, VIDEO_DEFAULT_DEVICE_ID } from '@/features/user/video/VideoInputContext';
import type {
  JoinVoiceResponse,
  VoiceCameraTrack,
  VoiceParticipantInit,
  VoiceScreenShare,
} from '@/types/voice';
import { buildIceServers, getJoinErrorKey, hasRelayServer } from '../voiceUtils';

interface UseVoiceRoomParams {
  seedParticipantsFromJoin: (roomId: string, initial: VoiceParticipantInit[]) => void;
  syncParticipantsFromRoom: (roomId: string, room: Room) => void;
}

type VoiceTargetKind = 'channel' | 'conversation';

interface JoinVoiceTargetParams {
  kind: VoiceTargetKind;
  targetId: string;
  targetName?: string;
  guildId?: string;
  guildName?: string;
  join: () => Promise<JoinVoiceResponse>;
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
  const { selectedDeviceId: selectedVideoInputDeviceId } = useVideoInput();

  const [activeTargetKind, setActiveTargetKind] = useState<VoiceTargetKind | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeChannelName, setActiveChannelName] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversationName, setActiveConversationName] = useState<string | null>(null);
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
  const [cameraTracks, setCameraTracks] = useState<VoiceCameraTrack[]>([]);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

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

  const upsertCameraTrack = useCallback((cameraTrack: VoiceCameraTrack) => {
    setCameraTracks((prev) => {
      const existingIndex = prev.findIndex((track) => track.trackSid === cameraTrack.trackSid);
      if (existingIndex === -1) {
        return [
          ...prev.filter((track) => track.participantId !== cameraTrack.participantId),
          cameraTrack,
        ];
      }

      const next = [...prev];
      next[existingIndex] = cameraTrack;
      return next;
    });
  }, []);

  const removeCameraTrack = useCallback((trackSid: string) => {
    setCameraTracks((prev) => prev.filter((track) => track.trackSid !== trackSid));
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
    setActiveTargetKind(null);
    setActiveChannelId(null);
    setActiveChannelName(null);
    setActiveConversationId(null);
    setActiveConversationName(null);
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
    setCameraTracks([]);
    setIsCameraEnabled(false);
    setCameraError(null);
  }, []);

  const leaveCall = useCallback(() => {
    void disconnectRoom();
  }, [disconnectRoom]);

  const joinTarget = useCallback(
    async ({ kind, targetId, targetName, guildId, guildName, join }: JoinVoiceTargetParams) => {
      setJoinError(null);
      setIsJoining(true);
      try {
        await disconnectRoom();

        const { token, url, iceServers, currentParticipants } = await join();
        if (currentParticipants && currentParticipants.length > 0) {
          seedParticipantsFromJoin(targetId, currentParticipants);
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

          if (track.kind === Track.Kind.Video && publication.source === Track.Source.Camera) {
            upsertCameraTrack({
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
              targetKind: kind,
              targetId,
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

          if (track.kind === Track.Kind.Video && publication.source === Track.Source.Camera) {
            removeCameraTrack(publication.trackSid);
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
            targetKind: kind,
            targetId,
            participantIdentity: participant.identity,
            trackSid,
            error,
          });
        });

        room.on(RoomEvent.TrackUnpublished, (publication) => {
          if (publication.source === Track.Source.ScreenShare) {
            removeScreenShare(publication.trackSid);
          }
          if (publication.source === Track.Source.Camera) {
            removeCameraTrack(publication.trackSid);
          }
        });

        room.on(RoomEvent.TrackMuted, (publication, participant) => {
          if (publication.source !== Track.Source.Camera) return;
          removeCameraTrack(publication.trackSid);
          if (participant.isLocal) {
            setIsCameraEnabled(false);
          }
        });

        room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
          if (
            publication.source !== Track.Source.Camera ||
            publication.kind !== Track.Kind.Video ||
            !publication.track
          ) {
            return;
          }

          upsertCameraTrack({
            participantId: participant.identity,
            trackSid: publication.trackSid,
            track: publication.track as VoiceCameraTrack['track'],
            isLocal: participant.isLocal,
          });
          if (participant.isLocal) {
            setIsCameraEnabled(true);
            setCameraError(null);
          }
        });

        room.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
          if (publication.kind !== Track.Kind.Video || !publication.track) {
            return;
          }

          if (publication.source === Track.Source.ScreenShare) {
            upsertScreenShare({
              participantId: participant.identity,
              trackSid: publication.trackSid,
              track: publication.track,
              isLocal: true,
            });
            setIsScreenSharing(true);
            setScreenShareError(null);
          }

          if (publication.source === Track.Source.Camera) {
            upsertCameraTrack({
              participantId: participant.identity,
              trackSid: publication.trackSid,
              track: publication.track,
              isLocal: true,
            });
            setIsCameraEnabled(true);
            setCameraError(null);
          }
        });

        room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
          if (publication.source === Track.Source.ScreenShare) {
            removeScreenShare(publication.trackSid);
            setIsScreenSharing(false);
          }
          if (publication.source === Track.Source.Camera) {
            removeCameraTrack(publication.trackSid);
            setIsCameraEnabled(false);
          }
        });

        room.on(RoomEvent.ParticipantConnected, () => {
          syncParticipantsFromRoom(targetId, room);
        });
        room.on(RoomEvent.ParticipantDisconnected, () => {
          syncParticipantsFromRoom(targetId, room);
        });
        room.on(RoomEvent.Connected, () => {
          syncParticipantsFromRoom(targetId, room);
        });
        room.on(RoomEvent.Reconnected, () => {
          syncParticipantsFromRoom(targetId, room);
        });

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
          setSpeakingUserIds(new Set(speakers.map((s) => s.identity)));
        });

        room.on(RoomEvent.SignalReconnecting, () => {
          console.warn('[Voice] Signal reconnecting', { targetKind: kind, targetId });
        });

        room.on(RoomEvent.Reconnecting, () => {
          console.warn('[Voice] Media reconnecting', { targetKind: kind, targetId });
        });

        room.on(RoomEvent.MediaDevicesError, (error) => {
          console.error('[Voice] Media device error', error);
        });

        room.on(RoomEvent.Disconnected, () => {
          setActiveTargetKind(null);
          setActiveChannelId(null);
          setActiveChannelName(null);
          setActiveConversationId(null);
          setActiveConversationName(null);
          setActiveGuildId(null);
          setActiveGuildName(null);
          setPing(null);
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
          setIsMuted(false);
          setScreenShares([]);
          setIsScreenSharing(false);
          setCameraTracks([]);
          setIsCameraEnabled(false);
          roomRef.current = null;
        });

        await room.connect(url, token, {
          ...(resolvedIceServers ? { rtcConfig: { iceServers: resolvedIceServers } } : {}),
          peerConnectionTimeout: 30000,
        });
        if (selectedInputDeviceId && selectedInputDeviceId !== 'default') {
          await room.switchActiveDevice('audioinput', selectedInputDeviceId);
        }
        if (selectedVideoInputDeviceId && selectedVideoInputDeviceId !== VIDEO_DEFAULT_DEVICE_ID) {
          await room.switchActiveDevice('videoinput', selectedVideoInputDeviceId);
        }
        await room.localParticipant.setMicrophoneEnabled(!inputMuted);

        roomRef.current = room;
        setActiveTargetKind(kind);
        setActiveChannelId(kind === 'channel' ? targetId : null);
        setActiveChannelName(kind === 'channel' ? (targetName ?? null) : null);
        setActiveConversationId(kind === 'conversation' ? targetId : null);
        setActiveConversationName(kind === 'conversation' ? (targetName ?? null) : null);
        setActiveGuildId(kind === 'channel' ? (guildId ?? null) : null);
        setActiveGuildName(kind === 'channel' ? (guildName ?? null) : null);
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
        console.error('[Voice] joinTarget failed:', err);
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
      removeCameraTrack,
      seedParticipantsFromJoin,
      selectedInputDeviceId,
      selectedVideoInputDeviceId,
      syncParticipantsFromRoom,
      upsertCameraTrack,
      upsertScreenShare,
    ]
  );

  const joinChannel = useCallback(
    async (channelId: string, channelName?: string, guildId?: string, guildName?: string) => {
      await joinTarget({
        kind: 'channel',
        targetId: channelId,
        targetName: channelName,
        guildId,
        guildName,
        join: () => joinVoiceChannel(channelId),
      });
    },
    [joinTarget]
  );

  const joinConversation = useCallback(
    async (conversationId: string, conversationName?: string) => {
      await joinTarget({
        kind: 'conversation',
        targetId: conversationId,
        targetName: conversationName,
        join: () => joinConversationVoiceCall(conversationId),
      });
    },
    [joinTarget]
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

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;

    const nextEnabled = !isCameraEnabled;
    setCameraError(null);
    const cameraOptions =
      selectedVideoInputDeviceId === VIDEO_DEFAULT_DEVICE_ID
        ? undefined
        : { deviceId: { exact: selectedVideoInputDeviceId } };

    try {
      await room.localParticipant.setCameraEnabled(nextEnabled, cameraOptions);
      setIsCameraEnabled(room.localParticipant.isCameraEnabled);
      if (!room.localParticipant.isCameraEnabled) {
        const cameraPublication = room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (cameraPublication) {
          removeCameraTrack(cameraPublication.trackSid);
        }
      }
    } catch (error) {
      console.error('[Voice] Failed to toggle camera', { error });
      setCameraError('voice.cameraError');
      setIsCameraEnabled(room.localParticipant.isCameraEnabled);
    }
  }, [isCameraEnabled, removeCameraTrack, selectedVideoInputDeviceId]);

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

  // Sync camera input device when it changes
  useEffect(() => {
    const room = roomRef.current;
    if (!room) return;

    const exact = selectedVideoInputDeviceId !== VIDEO_DEFAULT_DEVICE_ID;
    void room.switchActiveDevice('videoinput', selectedVideoInputDeviceId, exact).catch((error) => {
      console.error('[Voice] Failed to switch camera input device', {
        deviceId: selectedVideoInputDeviceId,
        error,
      });
      setCameraError('voice.cameraError');
    });
  }, [selectedVideoInputDeviceId]);

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

  const updateActiveConversationMeta = useCallback((conversationName: string) => {
    setActiveConversationName(conversationName);
  }, []);

  return {
    activeTargetKind,
    activeChannelId,
    activeChannelName,
    activeConversationId,
    activeConversationName,
    activeGuildId,
    activeGuildName,
    ping,
    updateActiveChannelMeta,
    updateActiveConversationMeta,
    isMuted,
    isJoining,
    joinError,
    speakingUserIds,
    screenShares,
    isScreenSharing,
    screenShareError,
    cameraTracks,
    isCameraEnabled,
    cameraError,
    joinChannel,
    joinConversation,
    leaveChannel: leaveCall,
    leaveCall,
    toggleMute,
    toggleScreenShare,
    toggleCamera,
  };
};
