import { apiFetch, parseOrThrow } from '@/api/client';
import type { Channel } from '@/types/guild';
import type {
  Message,
  MessageList,
  PinnedMessageList,
  MessageReactionUsersList,
  UpdateChannelInput,
} from '@/types/channel';
import type { JoinVoiceResponse } from '@/types/voice';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const sendMessage = (
  channelId: string,
  content: string,
  attachmentFileIds: string[] = []
): Promise<Message> =>
  apiFetch(`${API_BASE}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: content || null, attachmentFileIds }),
  }).then((r) => parseOrThrow<Message>(r));

export const getChannelMessages = (channelId: string, before?: string): Promise<MessageList> => {
  const url = new URL(`${API_BASE}/channels/${channelId}/messages`);
  if (before) url.searchParams.set('Before', before);
  return apiFetch(url.toString()).then((r) => parseOrThrow<MessageList>(r));
};

export const getChannelPinnedMessages = (
  channelId: string,
  before?: string | null
): Promise<PinnedMessageList> => {
  const url = new URL(`${API_BASE}/channels/${channelId}/pins`);
  if (before) url.searchParams.set('before', before);
  return apiFetch(url.toString()).then((r) => parseOrThrow<PinnedMessageList>(r));
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

export const pinMessage = (channelId: string, messageId: string): Promise<void> =>
  apiFetch(`${API_BASE}/channels/${channelId}/messages/${messageId}/pin`, {
    method: 'PUT',
  }).then((r) => {
    if (!r.ok) throw new Error('Failed to pin message');
  });

export const unpinMessage = (channelId: string, messageId: string): Promise<void> =>
  apiFetch(`${API_BASE}/channels/${channelId}/messages/${messageId}/pin`, {
    method: 'DELETE',
  }).then((r) => {
    if (!r.ok) throw new Error('Failed to unpin message');
  });

export const ackChannel = (channelId: string, messageId: string): Promise<void> =>
  apiFetch(`${API_BASE}/channels/${channelId}/ack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId }),
  }).then((r) => {
    if (!r.ok) throw new Error('Failed to ack channel');
  });

export const updateMessage = (
  channelId: string,
  messageId: string,
  content: string
): Promise<Message> =>
  apiFetch(`${API_BASE}/channels/${channelId}/messages/${messageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  }).then((r) => parseOrThrow<Message>(r));

export const addReaction = (channelId: string, messageId: string, emoji: string): Promise<void> =>
  apiFetch(
    `${API_BASE}/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    { method: 'PUT' }
  ).then((r) => {
    if (!r.ok) throw new Error('Failed to add reaction');
  });

export const deleteAttachment = (
  channelId: string,
  messageId: string,
  attachmentId: string
): Promise<void> =>
  apiFetch(
    `${API_BASE}/channels/${channelId}/messages/${messageId}/attachments/${encodeURIComponent(attachmentId)}`,
    { method: 'DELETE' }
  ).then((r) => {
    if (!r.ok) throw new Error('Failed to delete attachment');
  });

export const removeReaction = (
  channelId: string,
  messageId: string,
  emoji: string
): Promise<void> =>
  apiFetch(
    `${API_BASE}/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    { method: 'DELETE' }
  ).then((r) => {
    if (!r.ok) throw new Error('Failed to remove reaction');
  });

export const getChannelReactionUsers = (
  channelId: string,
  messageId: string,
  emoji: string,
  cursor?: string | null
): Promise<MessageReactionUsersList> => {
  const url = new URL(
    `${API_BASE}/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/users`
  );
  if (cursor) url.searchParams.set('Cursor', cursor);
  return apiFetch(url.toString()).then((r) => parseOrThrow<MessageReactionUsersList>(r));
};

export const joinVoiceChannel = (channelId: string): Promise<JoinVoiceResponse> =>
  apiFetch(`${API_BASE}/channels/${channelId}/voice/join`, {
    method: 'POST',
  }).then((r) => parseOrThrow<JoinVoiceResponse>(r));
