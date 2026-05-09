import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@harmonie/ui';
import { Users } from 'lucide-react';
import { getConversationPinnedMessages, sendConversationMessage } from '@/api/conversations';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { REALTIME_CLIENT_METHODS } from '@/features/realtime/constants';
import { useUser } from '@/features/user/UserContext';
import { MessageThread, useMessageThreadRefs } from '@/shared/message/MessageThread';
import type { ConversationParticipant } from '@/types/conversation';
import { useConversation, useConversationMembersPanel } from '../ConversationContext';
import { getConversationLabel } from '../conversationUtils';
import { useConversationMessages } from './hooks/useConversationMessages';
import {
  ConversationParticipantPopover,
  ConversationParticipantsPanel,
} from './ConversationParticipantsPanel';

interface SelectedParticipant {
  participant: ConversationParticipant;
  rect: DOMRect;
}

export const ConversationView = () => {
  const { t } = useTranslation();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useUser();
  const { connection } = useRealtime();
  const conversation = useConversation(conversationId);
  const { membersOpen, setMembersOpen, toggleMembersOpen } =
    useConversationMembersPanel(conversationId);

  const [selectedParticipant, setSelectedParticipant] = useState<SelectedParticipant | null>(null);
  const threadRefs = useMessageThreadRefs();

  const {
    messages,
    loading,
    error,
    loadingMore,
    editingMessageId,
    lastReadMessageId,
    latestOwnMessage,
    loadMore,
    loadUntilMessage,
    startEditing,
    cancelEditing,
    dismissNewMessagesSeparator,
    saveEdit,
    removeMessage,
    removeAttachment,
    setMessagePinned,
    toggleReaction,
    typingUserIds,
  } = useConversationMessages({
    conversationId,
    connection,
    currentUserId: user?.userId,
  });

  const membersMap = useMemo(() => {
    const map = new Map<string, ConversationParticipant>();
    if (conversation?.participants) {
      for (const p of conversation.participants) {
        map.set(p.userId, p);
      }
    }
    return map;
  }, [conversation]);

  const conversationTitle = useMemo(() => {
    if (!conversation) return conversationId ?? '';
    return getConversationLabel(conversation, user?.userId);
  }, [conversation, conversationId, user?.userId]);

  const handleAvatarClick = (participant: ConversationParticipant, rect: DOMRect) => {
    setSelectedParticipant((prev) =>
      prev?.participant.userId === participant.userId ? null : { participant, rect }
    );
  };

  useEffect(() => {
    setSelectedParticipant(null);
  }, [conversationId]);

  if (!conversationId) return null;

  const isGroup = conversation?.type === 'Group';

  return (
    <>
      <div className="flex h-full gap-2">
        <MessageThread
          resetKey={conversationId}
          title={conversationTitle}
          afterPinActions={
            isGroup ? (
              <IconButton
                size="small"
                aria-label={t('conversation.participantsTitle')}
                title={t('conversation.participantsTitle')}
                onClick={toggleMembersOpen}
              >
                <Users size={16} />
              </IconButton>
            ) : undefined
          }
          refs={threadRefs}
          messages={messages}
          loading={loading}
          error={error}
          loadingMore={loadingMore}
          editingMessageId={editingMessageId}
          lastReadMessageId={lastReadMessageId}
          latestOwnMessage={latestOwnMessage}
          typingUserIds={typingUserIds}
          labels={{
            loading: t('conversation.loading'),
            error: t('conversation.error'),
            empty: t('conversation.empty'),
          }}
          currentUser={user}
          authorMap={membersMap}
          reactionSource={{ type: 'conversation', entityId: conversationId }}
          composer={{
            draftKey: `conversation:${conversationId}`,
            sendFn: (content, fileIds, replyToMessageId) =>
              sendConversationMessage(conversationId, content, fileIds, replyToMessageId),
            onTypingStart: () =>
              connection
                ?.send(REALTIME_CLIENT_METHODS.startTypingConversation, conversationId)
                .catch(() => {}),
          }}
          pinned={{
            entityId: conversationId,
            fetchPinnedMessages: getConversationPinnedMessages,
          }}
          loadMore={loadMore}
          loadUntilMessage={loadUntilMessage}
          startEditing={startEditing}
          cancelEditing={cancelEditing}
          dismissNewMessagesSeparator={dismissNewMessagesSeparator}
          saveEdit={saveEdit}
          removeMessage={removeMessage}
          removeAttachment={removeAttachment}
          setMessagePinned={(messageId, isPinned) => void setMessagePinned(messageId, isPinned)}
          toggleReaction={toggleReaction}
          onAvatarClick={handleAvatarClick}
        />

        {isGroup && membersOpen && conversation && (
          <ConversationParticipantsPanel
            participants={conversation.participants}
            onClose={() => setMembersOpen(false)}
          />
        )}
      </div>

      {selectedParticipant && (
        <ConversationParticipantPopover
          participant={selectedParticipant.participant}
          anchorRect={selectedParticipant.rect}
          onClose={() => setSelectedParticipant(null)}
          side="right"
        />
      )}
    </>
  );
};
