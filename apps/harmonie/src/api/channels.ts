import { apiFetch, parseOrThrow } from '@/api/client.ts';
import type { Channel } from '@/types/guild';
import type { MessageList, UpdateChannelInput } from '@/types/channel';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const getChannelMessages = (channelId: string): Promise<MessageList> =>
  apiFetch(`${API_BASE}/channels/${channelId}/messages`).then((r) => parseOrThrow<MessageList>(r));

export const updateChannel = (channelId: string, input: UpdateChannelInput): Promise<Channel> =>
  apiFetch(`${API_BASE}/channels/${channelId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => parseOrThrow<Channel>(r));

export const deleteChannel = (channelId: string): Promise<void> =>
  apiFetch(`${API_BASE}/channels/${channelId}`, {
    method: 'DELETE',
  }).then((r) => {
    if (!r.ok) throw new Error('Failed to delete channel');
  });
