import type { AvatarAppearance } from '@/types/user';
import type { VoiceParticipantInit } from '@/types/voice';

export interface Guild {
  guildId: string;
  name: string;
  ownerUserId: string;
  role: string;
  joinedAtUtc: string;
  iconFileId: string | null;
  icon: GuildIcon | null;
}

export interface GuildIcon {
  name: string;
  color: string;
  bg: string;
}

export interface CreateGuildIconInput {
  name: string | null;
  color: string | null;
  bg: string | null;
}

export interface Channel {
  channelId: string;
  name: string;
  type: 'Text' | 'Voice';
  isDefault: boolean;
  position: number;
  currentParticipants?: VoiceParticipantInit[] | null;
}

export interface ChannelList {
  guildId: string;
  channels: Channel[];
}

export interface CreateGuildResponse {
  guildId: string;
  name: string;
  ownerUserId: string;
  iconFileId: string | null;
  icon: GuildIcon | null;
}

export interface CreateChannelInput {
  name: string;
  type: 'Text' | 'Voice';
  position: number;
}

export interface UpdateGuildInput {
  name?: string;
  iconFileId?: string | null;
  icon?: CreateGuildIconInput;
}

export interface GuildMember {
  userId: string;
  username: string;
  displayName: string | null;
  avatarFileId?: string | null;
  avatar?: AvatarAppearance;
  bio?: string;
  isActive: boolean;
  role: string;
  joinedAtUtc: string;
}

export interface GuildMemberList {
  guildId: string;
  members: GuildMember[];
}

export interface GuildInvite {
  code: string;
  creatorId: string;
  usesCount: number;
  maxUses: number | null;
  expiresAtUtc: string | null;
  createdAtUtc: string;
  revokedAtUtc: string | null;
  isExpired: boolean;
}

export interface GuildInviteList {
  guildId: string;
  invites: GuildInvite[];
}

export interface CreateGuildInviteInput {
  maxUses: number | null;
  expiresInHours: number | null;
}

export interface InvitePreview {
  guildName: string;
  guildIconFileId: string | null;
  guildIcon: GuildIcon | null;
  memberCount: number;
  usesCount: number;
  maxUses: number | null;
  expiresAtUtc: string | null;
}

export interface ReorderChannelEntry {
  channelId: string;
  position: number;
}

export interface ReorderChannelsInput {
  channels: ReorderChannelEntry[];
}

export interface CreateGuildInviteResponse {
  inviteId: string;
  code: string;
  guildId: string;
  creatorId: string;
  maxUses: number | null;
  usesCount: number;
  expiresAtUtc: string | null;
  createdAtUtc: string;
}

export interface GuildBan {
  userId: string;
  username: string;
  displayName: string | null;
  avatarFileId: string | null;
  avatar: {
    color: string | null;
    icon: string | null;
    bg: string | null;
  };
  reason: string | null;
  bannedBy: string;
  createdAtUtc: string;
}

export interface GuildBanList {
  guildId: string;
  bans: GuildBan[];
}

export interface BanMemberInput {
  userId: string;
  reason: string | null;
  purgeMessagesDays: number;
}

export type GuildMemberRole = 'Admin' | 'Member';

export interface UpdateMemberRoleInput {
  role: GuildMemberRole;
}

export interface GuildMessageSearchItem {
  messageId: string;
  channelId: string;
  channelName: string;
  authorUserId: string;
  authorUsername: string;
  authorDisplayName: string | null;
  authorAvatarFileId: string | null;
  authorAvatar: {
    color: string | null;
    icon: string | null;
    bg: string | null;
  };
  content: string;
  attachments: {
    fileId: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
  }[];
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface GuildMessageSearchResponse {
  guildId: string;
  items: GuildMessageSearchItem[];
  nextCursor: string | null;
}

export interface GuildMessageSearchParams {
  q?: string;
  channelId?: string;
  authorId?: string;
  before?: string;
  after?: string;
  cursor?: string;
  limit?: number;
}

export interface GuildDeletedEvent {
  guildId: string;
}

export interface GuildOwnershipTransferredEvent {
  guildId: string;
  newOwnerUserId: string;
  newOwnerUsername: string;
  newOwnerDisplayName: string | null;
}

export interface GuildUpdatedEvent {
  guildId: string;
  name: string;
  iconFileId: string | null;
}

export interface ChannelCreatedEvent {
  guildId: string;
  channelId: string;
  name: string;
  type: Channel['type'] | string;
  isDefault: boolean;
  position: number;
}

export interface ChannelUpdatedEvent {
  guildId: string;
  channelId: string;
  name: string;
  position: number;
}

export interface ChannelDeletedEvent {
  guildId: string;
  channelId: string;
}

export interface ChannelsReorderedEvent {
  guildId: string;
  channels: ReorderChannelEntry[];
}

export interface MemberEvent {
  guildId: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarFileId?: string | null;
}

export interface MemberRoleUpdatedEvent extends MemberEvent {
  newRole: GuildMemberRole | string;
}

export interface UserPresenceChangedEvent {
  userId: string;
  status: string;
}
