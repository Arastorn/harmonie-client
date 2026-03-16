import type { AvatarAppearance } from '@/types/user';

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
