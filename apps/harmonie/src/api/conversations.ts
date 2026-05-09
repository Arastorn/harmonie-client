import { apiFetch, parseOrThrow } from '@/api/client';
import type {
  Message,
  MessageList,
  MessageReactionUsersList,
  PinnedMessageList,
} from '@/types/channel';
import type {
  ConversationCreateResponse,
  ConversationList,
  SearchUsersResult,
} from '@/types/conversation';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const getConversations = (): Promise<ConversationList> =>
  apiFetch(`${API_BASE}/conversations`).then((r) => parseOrThrow<ConversationList>(r));

export const openDirectConversation = (targetUserId: string): Promise<ConversationCreateResponse> =>
  apiFetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUserId }),
  }).then((r) => parseOrThrow<ConversationCreateResponse>(r));

export const createGroupConversation = (
  name: string | null,
  participantUserIds: string[]
): Promise<ConversationCreateResponse> =>
  apiFetch(`${API_BASE}/conversations/group`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name || null, participantUserIds }),
  }).then((r) => parseOrThrow<ConversationCreateResponse>(r));

export const updateConversationName = (
  conversationId: string,
  name: string | null
): Promise<void> => {
  const trimmedName = name?.trim();
  const body = trimmedName ? JSON.stringify({ name: trimmedName }) : '{"name":null}';

  return apiFetch(`${API_BASE}/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).then((r) => {
    if (!r.ok) throw new Error('Failed to update conversation');
  });
};

export const getConversationMessages = (
  conversationId: string,
  before?: string
): Promise<MessageList> => {
  const url = new URL(`${API_BASE}/conversations/${conversationId}/messages`);
  if (before) url.searchParams.set('Before', before);
  return apiFetch(url.toString()).then((r) => parseOrThrow<MessageList>(r));
};

export const getConversationPinnedMessages = (
  conversationId: string,
  before?: string | null
): Promise<PinnedMessageList> => {
  const url = new URL(`${API_BASE}/conversations/${conversationId}/pins`);
  if (before) url.searchParams.set('before', before);
  return apiFetch(url.toString()).then((r) => parseOrThrow<PinnedMessageList>(r));
};

export const sendConversationMessage = (
  conversationId: string,
  content: string,
  attachmentFileIds: string[] = [],
  replyToMessageId?: string | null
): Promise<Message> =>
  apiFetch(`${API_BASE}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: content || null, attachmentFileIds, replyToMessageId }),
  }).then((r) => parseOrThrow<Message>(r));

export const updateConversationMessage = (
  conversationId: string,
  messageId: string,
  content: string
): Promise<Message> =>
  apiFetch(`${API_BASE}/conversations/${conversationId}/messages/${messageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  }).then((r) => parseOrThrow<Message>(r));

export const deleteConversationMessage = (
  conversationId: string,
  messageId: string
): Promise<void> =>
  apiFetch(`${API_BASE}/conversations/${conversationId}/messages/${messageId}`, {
    method: 'DELETE',
  }).then((r) => {
    if (!r.ok) throw new Error('Failed to delete conversation message');
  });

export const pinConversationMessage = (conversationId: string, messageId: string): Promise<void> =>
  apiFetch(`${API_BASE}/conversations/${conversationId}/messages/${messageId}/pin`, {
    method: 'PUT',
  }).then((r) => {
    if (!r.ok) throw new Error('Failed to pin conversation message');
  });

export const unpinConversationMessage = (
  conversationId: string,
  messageId: string
): Promise<void> =>
  apiFetch(`${API_BASE}/conversations/${conversationId}/messages/${messageId}/pin`, {
    method: 'DELETE',
  }).then((r) => {
    if (!r.ok) throw new Error('Failed to unpin conversation message');
  });

export const deleteConversationMessageAttachment = (
  conversationId: string,
  messageId: string,
  attachmentId: string
): Promise<void> =>
  apiFetch(
    `${API_BASE}/conversations/${conversationId}/messages/${messageId}/attachments/${encodeURIComponent(attachmentId)}`,
    { method: 'DELETE' }
  ).then((r) => {
    if (!r.ok) throw new Error('Failed to delete conversation message attachment');
  });

export const ackConversation = (conversationId: string, messageId: string): Promise<void> =>
  apiFetch(`${API_BASE}/conversations/${conversationId}/ack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId }),
  }).then((r) => {
    if (!r.ok) throw new Error('Failed to ack conversation');
  });

export const addConversationReaction = (
  conversationId: string,
  messageId: string,
  emoji: string
): Promise<void> =>
  apiFetch(
    `${API_BASE}/conversations/${conversationId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    { method: 'PUT' }
  ).then((r) => {
    if (!r.ok) throw new Error('Failed to add conversation reaction');
  });

export const removeConversationReaction = (
  conversationId: string,
  messageId: string,
  emoji: string
): Promise<void> =>
  apiFetch(
    `${API_BASE}/conversations/${conversationId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    { method: 'DELETE' }
  ).then((r) => {
    if (!r.ok) throw new Error('Failed to remove conversation reaction');
  });

export const getConversationReactionUsers = (
  conversationId: string,
  messageId: string,
  emoji: string,
  cursor?: string | null
): Promise<MessageReactionUsersList> => {
  const url = new URL(
    `${API_BASE}/conversations/${conversationId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/users`
  );
  if (cursor) url.searchParams.set('Cursor', cursor);
  return apiFetch(url.toString()).then((r) => parseOrThrow<MessageReactionUsersList>(r));
};

export const deleteConversation = (conversationId: string): Promise<void> =>
  apiFetch(`${API_BASE}/conversations/${conversationId}`, { method: 'DELETE' }).then((r) => {
    if (!r.ok) throw new Error('Failed to delete conversation');
  });

export const searchUsers = (query: string): Promise<SearchUsersResult> => {
  const url = new URL(`${API_BASE}/users/search`);
  url.searchParams.set('Q', query);
  return apiFetch(url.toString()).then((r) => parseOrThrow<SearchUsersResult>(r));
};
