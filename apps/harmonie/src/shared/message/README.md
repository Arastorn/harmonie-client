# Message UI

This folder contains the shared chat/message experience used by text channels and conversations.

## Structure

- `MessageComposer.tsx` renders the message input and attachment draft flow.
- `MessageListItem/` renders a single message row: author avatar, content, inline edit mode, actions, context menu, and composition of attachments/reactions.
- `attachments/` contains attachment rendering, image lightbox, file chips, and attachment deletion UI.
- `reactions/` contains reaction pills, the hover popover, and the detailed reaction users modal.
- `hooks/` contains shared message state logic, realtime synchronization, pagination, typing, and formatting preference.
- `utils/` contains message presentation, HTML sanitizing, URL parsing, rich text label helpers, and reaction preview formatting.
- `types.ts` contains shared UI-facing message author types.

## Message Data Flow

Feature views provide the entity context:

- Text channels pass `channelId` through `useChannelMessages`.
- Conversations pass `conversationId` through `useConversationMessages`.

Both hooks wrap the generic `useMessages` hook, which owns:

- initial message loading;
- cursor-based pagination;
- optimistic message updates and deletes;
- optimistic reaction toggles;
- SignalR message and reaction events;
- read acknowledgements;
- inline edit state.

The feature view maps each loaded message into `MessageListItem`.

## Message List Item

`MessageListItem` is intentionally a composition boundary. It should coordinate message row state and delegate domain-specific UI:

- `MessageContent` renders sanitized message HTML.
- `MessageInlineEditor` handles edit mode.
- `MessageActions` exposes hover actions.
- `MessageEmojiPicker` opens the emoji picker.
- `MessageAttachments` renders attachments from `../attachments`.
- `MessageReactions` renders reactions from `../reactions`.

Avoid adding attachment or reaction-specific UI directly inside `MessageListItem`. Put that code in the dedicated sibling folders instead.

## Reactions

`MessageReactions` renders the reaction pills and coordinates:

- hover/focus preview popover;
- reaction toggle through `onToggle`;
- detailed users modal;
- channel/conversation-specific API calls for reaction users.

The reaction popover uses a portal attached to `document.body` so it is not clipped by message list stacking contexts or overflow containers.

The detailed modal fetches users with the correct route depending on the source:

- `GET /channels/{channelId}/messages/{messageId}/reactions/{emoji}/users`
- `GET /conversations/{conversationId}/messages/{messageId}/reactions/{emoji}/users`

Feature views pass a `reactionUserMap` so the modal can enrich returned users with locally known avatar information.

## Attachments

Attachment UI is isolated in `attachments/`.

The entry point is `MessageAttachments`, which decides whether each attachment is rendered as:

- an image preview;
- a file chip;
- a lightbox image;
- a delete confirmation modal.

Image and file download URLs use the shared blob URL cache from `useFileBlobUrl`.

## Realtime Notes

SignalR reaction events are handled in `hooks/useMessages.ts`.

`ReactionAdded` includes reactor identity fields:

- `userId`
- `reactorUsername`
- `reactorDisplayName`
- `emoji`

The hook updates counts and keeps up to five preview users for the hover popover. When the current user reacts optimistically, `MessageReactions` can inject the current user into the preview so the popover does not show an empty state before a reload.
