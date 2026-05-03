export interface MessageReaction {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  users?: MessageReactionUser[];
}

export interface MessageReactionUser {
  userId: string;
  username: string;
  displayName?: string | null;
}

export interface MessageReactionUsersList {
  messageId: string;
  emoji: string;
  totalCount: number | string;
  users: MessageReactionUser[];
  nextCursor: string | null;
}

export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
}

export interface Message {
  messageId: string;
  authorUserId: string;
  content: string | null;
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  previews?: LinkPreview[];
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface MessageList {
  conversationId: string;
  items: Message[];
  nextCursor: string | null;
  lastReadMessageId: string | null;
}

export interface UpdateChannelInput {
  name: string;
}

export interface MessageAttachment {
  fileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface MessageCreatedEvent {
  messageId: string;
  channelId: string;
  guildId: string;
  authorUserId: string;
  authorUsername: string;
  authorDisplayName?: string | null;
  content: string;
  attachments: MessageAttachment[];
  createdAtUtc: string;
}

export interface MessageDeletedEvent {
  messageId: string;
  channelId: string;
  guildId: string;
}

export interface MessageUpdatedEvent {
  messageId: string;
  channelId: string;
  guildId: string;
  content: string;
  updatedAtUtc: string;
}

export interface ReactionAddedEvent {
  messageId: string;
  channelId: string;
  guildId: string;
  emoji: string;
  userId: string;
}

export interface ReactionRemovedEvent {
  messageId: string;
  channelId: string;
  guildId: string;
  emoji: string;
  userId: string;
}

export interface UserTypingEvent {
  userId: string;
  username?: string;
  displayName?: string | null;
  channelId: string;
  timestamp: string;
}

export interface MessagePreviewUpdatedEvent {
  messageId: string;
  channelId?: string | null;
  conversationId?: string | null;
  guildId?: string | null;
  previews: LinkPreview[];
}
