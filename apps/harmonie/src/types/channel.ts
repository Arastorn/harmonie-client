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
