export interface VoiceParticipantInit {
  userId: string;
  username: string;
  displayName: string | null;
  avatarFileId: string | null;
  avatarBg: string | null;
  avatarColor: string | null;
  avatarIcon: string | null;
}

export interface JoinVoiceResponse {
  token: string;
  url: string;
  roomName: string;
  iceServers?: RTCIceServer[];
  currentParticipants?: VoiceParticipantInit[];
}

export interface VoiceParticipant {
  userId: string;
  username: string;
  displayName: string | null;
  avatarFileId: string | null;
  avatarBg: string | null;
  avatarColor: string | null;
  avatarIcon: string | null;
}

export interface VoiceParticipantJoinedEvent {
  guildId: string;
  channelId: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarFileId: string | null;
  avatarBg: string | null;
  avatarColor: string | null;
  avatarIcon: string | null;
  joinedAtUtc: string;
}

export interface VoiceParticipantLeftEvent {
  guildId: string;
  channelId: string;
  userId: string;
  leftAtUtc: string;
}
