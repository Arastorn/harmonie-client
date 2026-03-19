import { apiFetch, parseOrThrow } from '@/api/client';
import type { Channel } from '@/types/guild';
import type { Message, MessageList, UpdateChannelInput } from '@/types/channel';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const sendMessage = (channelId: string, content: string): Promise<Message> =>
  apiFetch(`${API_BASE}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, attachmentFileIds: [] }),
  }).then((r) => parseOrThrow<Message>(r));

export const getChannelMessages = (channelId: string, before?: string): Promise<MessageList> => {
  const url = new URL(`${API_BASE}/channels/${channelId}/messages`);
  if (before) url.searchParams.set('Before', before);
  return apiFetch(url.toString()).then((r) => parseOrThrow<MessageList>(r));
};

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

export const deleteMessage = (channelId: string, messageId: string): Promise<void> =>
  apiFetch(`${API_BASE}/channels/${channelId}/messages/${messageId}`, {
    method: 'DELETE',
  }).then((r) => {
    if (!r.ok) throw new Error('Failed to delete message');
  });
