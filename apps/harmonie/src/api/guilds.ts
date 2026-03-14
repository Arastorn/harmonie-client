import { apiFetch, parseOrThrow } from './client';
import type {
  Channel,
  ChannelList,
  CreateChannelInput,
  CreateGuildIconInput,
  CreateGuildResponse,
  Guild,
  GuildMember,
  GuildMemberList,
  UpdateGuildInput,
} from '@/types/guild';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const listGuilds = (): Promise<{ guilds: Guild[] }> =>
  apiFetch(`${API_BASE}/guilds`).then((r) => parseOrThrow<{ guilds: Guild[] }>(r));

export const listChannels = (guildId: string): Promise<ChannelList> =>
  apiFetch(`${API_BASE}/guilds/${guildId}/channels`).then((r) => parseOrThrow<ChannelList>(r));

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

export type {
  Channel,
  ChannelList,
  CreateChannelInput,
  CreateGuildIconInput,
  CreateGuildResponse,
  Guild,
  GuildMember,
  GuildMemberList,
  UpdateGuildInput,
};
