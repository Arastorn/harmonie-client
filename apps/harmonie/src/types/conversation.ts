import type {
  MessageCreatedEvent,
  MessageDeletedEvent,
  MessageUpdatedEvent,
  ReactionAddedEvent,
  ReactionRemovedEvent,
} from './channel';
import type { AvatarAppearance } from './user';

export interface ConversationParticipant {
  userId: string;
  username: string;
  displayName?: string | null;
  avatarFileId?: string | null;
  avatar?: AvatarAppearance | null;
}

export interface Conversation {
  conversationId: string;
  type: 'Direct' | 'Group';
  name: string | null;
  participants: ConversationParticipant[];
  createdAtUtc: string;
}

export interface ConversationList {
  conversations: Conversation[];
}

export interface ConversationMessageCreatedEvent extends Omit<
  MessageCreatedEvent,
  'channelId' | 'guildId'
> {
  conversationId: string;
}

export interface ConversationMessageDeletedEvent extends Omit<
  MessageDeletedEvent,
  'channelId' | 'guildId'
> {
  conversationId: string;
}

export interface ConversationMessageUpdatedEvent extends Omit<
  MessageUpdatedEvent,
  'channelId' | 'guildId'
> {
  conversationId: string;
}

export interface ConversationReactionAddedEvent extends Omit<
  ReactionAddedEvent,
  'channelId' | 'guildId'
> {
  conversationId: string;
}

export interface ConversationReactionRemovedEvent extends Omit<
  ReactionRemovedEvent,
  'channelId' | 'guildId'
> {
  conversationId: string;
}

/** Shape returned by POST /conversations (create endpoints) */
export interface ConversationCreateResponse {
  conversationId: string;
  type: 'direct' | 'group';
  participantIds: string[];
  name?: string | null;
  createdAtUtc: string;
  created: boolean;
}

export interface ConversationUserTypingEvent {
  conversationId: string;
  userId: string;
  timestamp: string;
}

export interface SearchUser {
  userId: string;
  username: string;
  displayName: string | null;
  avatarFileId?: string | null;
  avatar?: AvatarAppearance | null;
}

export interface SearchUsersResult {
  users: SearchUser[];
}
