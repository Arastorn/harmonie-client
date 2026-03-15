export interface Message {
  messageId: string;
  authorUserId: string;
  content: string;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface MessageList {
  conversationId: string;
  items: Message[];
  nextCursor: string | null;
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
  authorUserId: string;
  content: string;
  attachments: MessageAttachment[];
  createdAtUtc: string;
}
