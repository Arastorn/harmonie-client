export interface MessageReaction {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface Message {
  messageId: string;
  authorUserId: string;
  content: string | null;
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
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
  channelId: string;
  timestamp: string;
}
