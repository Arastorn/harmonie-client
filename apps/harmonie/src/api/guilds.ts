import { apiFetch, parseOrThrow } from './client';
import type {
  BanMemberInput,
  Channel,
  ChannelList,
  CreateChannelInput,
  CreateGuildIconInput,
  CreateGuildInviteInput,
  CreateGuildInviteResponse,
  CreateGuildResponse,
  Guild,
  GuildBan,
  GuildBanList,
  GuildInvite,
  GuildInviteList,
  GuildMember,
  GuildMemberList,
  InvitePreview,
  ReorderChannelsInput,
  UpdateGuildInput,
} from '@/types/guild';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const listGuilds = (): Promise<{ guilds: Guild[] }> =>
  apiFetch(`${API_BASE}/guilds`).then((r) => parseOrThrow<{ guilds: Guild[] }>(r));

export const listChannels = (guildId: string): Promise<ChannelList> =>
  apiFetch(`${API_BASE}/guilds/${guildId}/channels`).then((r) => parseOrThrow<ChannelList>(r));

export const reorderChannels = (
  guildId: string,
  input: ReorderChannelsInput
): Promise<ChannelList> =>
  apiFetch(`${API_BASE}/guilds/${guildId}/channels/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => parseOrThrow<ChannelList>(r));

export const createChannel = (guildId: string, input: CreateChannelInput): Promise<Channel> =>
  apiFetch(`${API_BASE}/guilds/${guildId}/channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => parseOrThrow<Channel>(r));

export const createGuild = (input: {
  name: string;
  iconFileId: string | null;
  icon: CreateGuildIconInput;
}): Promise<CreateGuildResponse> =>
  apiFetch(`${API_BASE}/guilds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => parseOrThrow<CreateGuildResponse>(r));

export const updateGuild = (guildId: string, input: UpdateGuildInput): Promise<Guild> =>
  apiFetch(`${API_BASE}/guilds/${guildId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => parseOrThrow<Guild>(r));

export const listGuildMembers = (guildId: string): Promise<GuildMemberList> =>
  apiFetch(`${API_BASE}/guilds/${guildId}/members`).then((r) => parseOrThrow<GuildMemberList>(r));

export const deleteGuild = (guildId: string): Promise<void> =>
  apiFetch(`${API_BASE}/guilds/${guildId}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw await r.json();
  });

export const getInvitePreview = (code: string): Promise<InvitePreview> =>
  apiFetch(`${API_BASE}/invites/${code}`).then((r) => parseOrThrow<InvitePreview>(r));

export const joinGuild = (code: string): Promise<Guild> =>
  apiFetch(`${API_BASE}/invites/${code}/accept`, {
    method: 'POST',
  }).then((r) => parseOrThrow<Guild>(r));

export const createGuildInvite = (
  guildId: string,
  input: CreateGuildInviteInput
): Promise<CreateGuildInviteResponse> =>
  apiFetch(`${API_BASE}/guilds/${guildId}/invites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => parseOrThrow<CreateGuildInviteResponse>(r));

export const listGuildInvites = (guildId: string): Promise<GuildInviteList> =>
  apiFetch(`${API_BASE}/guilds/${guildId}/invites`).then((r) => parseOrThrow<GuildInviteList>(r));

export const revokeGuildInvite = (guildId: string, inviteCode: string): Promise<void> =>
  apiFetch(`${API_BASE}/guilds/${guildId}/invites/${inviteCode}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw await r.json();
  });

export const banMember = (guildId: string, input: BanMemberInput): Promise<GuildBan> =>
  apiFetch(`${API_BASE}/guilds/${guildId}/bans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => parseOrThrow<GuildBan>(r));

export const listGuildBans = (guildId: string): Promise<GuildBanList> =>
  apiFetch(`${API_BASE}/guilds/${guildId}/bans`).then((r) => parseOrThrow<GuildBanList>(r));

export const unbanMember = (guildId: string, userId: string): Promise<void> =>
  apiFetch(`${API_BASE}/guilds/${guildId}/bans/${userId}`, {
    method: 'DELETE',
  }).then(async (r) => {
    if (!r.ok) throw await r.json();
  });

export type {
  BanMemberInput,
  Channel,
  ChannelList,
  CreateChannelInput,
  CreateGuildIconInput,
  CreateGuildInviteInput,
  CreateGuildInviteResponse,
  CreateGuildResponse,
  Guild,
  GuildBan,
  GuildBanList,
  GuildInvite,
  GuildInviteList,
  GuildMember,
  GuildMemberList,
  InvitePreview,
  ReorderChannelsInput,
  UpdateGuildInput,
};
