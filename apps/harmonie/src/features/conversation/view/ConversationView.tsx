import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, IconButton } from '@harmonie/ui';
import { Phone, PhoneOff, Users } from 'lucide-react';
import { getConversationPinnedMessages, sendConversationMessage } from '@/api/conversations';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { REALTIME_CLIENT_METHODS } from '@/features/realtime/constants';
import { useUser } from '@/features/user/UserContext';
import { MessageThread, useMessageThreadRefs } from '@/shared/message/MessageThread';
import { useVoicePresence } from '@/shared/voice/context/VoicePresenceContext';
import type { ConversationParticipant } from '@/types/conversation';
import type { VoiceParticipantInit } from '@/types/voice';
import { useConversation, useConversationMembersPanel } from '../ConversationContext';
import { sendStartConversationCall } from '../conversationCallRealtime';
import { getConversationLabel } from '../conversationUtils';
import { ConversationCallStage } from './ConversationCallStage';
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
  const voice = useVoicePresence();
  const { seedParticipants } = voice;
  const conversation = useConversation(conversationId);
  const { membersOpen, setMembersOpen, toggleMembersOpen } =
    useConversationMembersPanel(conversationId);

  const [selectedParticipant, setSelectedParticipant] = useState<SelectedParticipant | null>(null);
  const [callPanelConversationId, setCallPanelConversationId] = useState<string | null>(null);
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

  const conversationVoiceParticipants = useMemo<VoiceParticipantInit[]>(() => {
    if (!conversation?.participants) return [];

    return conversation.participants.map((participant) => ({
      userId: participant.userId,
      username: participant.username,
      displayName: participant.displayName ?? null,
      avatarFileId: participant.avatarFileId ?? null,
      avatarBg: participant.avatar?.bg ?? null,
      avatarColor: participant.avatar?.color ?? null,
      avatarIcon: participant.avatar?.icon ?? null,
    }));
  }, [conversation]);

  const isActiveConversationCall = voice.activeConversationId === conversationId;
  const isCallPanelOpen = isActiveConversationCall || callPanelConversationId === conversationId;

  const handleAvatarClick = (participant: ConversationParticipant, rect: DOMRect) => {
    setSelectedParticipant((prev) =>
      prev?.participant.userId === participant.userId ? null : { participant, rect }
    );
  };

  useEffect(() => {
    setSelectedParticipant(null);
    setCallPanelConversationId(null);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || conversationVoiceParticipants.length === 0) return;
    seedParticipants(conversationId, conversationVoiceParticipants);
  }, [conversationId, conversationVoiceParticipants, seedParticipants]);

  useEffect(() => {
    if (
      callPanelConversationId === conversationId &&
      !isActiveConversationCall &&
      !voice.isJoining &&
      !voice.joinError
    ) {
      setCallPanelConversationId(null);
    }
  }, [
    callPanelConversationId,
    conversationId,
    isActiveConversationCall,
    voice.isJoining,
    voice.joinError,
  ]);

  if (!conversationId) return null;

  const isGroup = conversation?.type === 'Group';

  const joinConversationCall = async () => {
    if (!conversationId) return;
    setCallPanelConversationId(conversationId);
    await voice.joinConversation(conversationId, conversationTitle);
    voice.updateActiveConversationMeta(conversationTitle);
  };

  const handleStartCall = async () => {
    void sendStartConversationCall(connection, conversationId);
    await joinConversationCall();
  };

  const handleLeaveConversationCall = () => {
    setCallPanelConversationId(null);
    voice.leaveCall();
  };

  return (
    <>
      <div className="flex h-full gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {isCallPanelOpen ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md bg-surface-1">
              <header className="flex h-14 shrink-0 items-center justify-between bg-surface-2 px-4">
                <div className="flex min-w-0 items-center gap-2">
                  <Phone size={16} className="shrink-0 text-text-3" />
                  <span className="truncate text-sm font-semibold text-text-1">
                    {conversationTitle}
                  </span>
                </div>
              </header>
              {isActiveConversationCall ? (
                <ConversationCallStage
                  conversationId={conversationId}
                  onLeave={handleLeaveConversationCall}
                />
              ) : (
                <div className="flex flex-1 items-center justify-center p-6">
                  <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-md border border-border-2 bg-surface-2 px-8 py-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-fg">
                      <Phone size={26} />
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {voice.isJoining ? t('voice.joining') : t('conversation.call.readyToJoin')}
                    </span>
                    {voice.joinError && <p className="text-sm text-error">{t(voice.joinError)}</p>}
                    <div className="flex items-center gap-2">
                      <Button variant="tertiary" onClick={() => setCallPanelConversationId(null)}>
                        <PhoneOff size={16} />
                        <span>{t('voice.leave')}</span>
                      </Button>
                      <Button
                        variant="primary"
                        isLoading={voice.isJoining}
                        onClick={() => void joinConversationCall()}
                      >
                        <Phone size={16} />
                        <span>{t('voice.join')}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <MessageThread
              resetKey={conversationId}
              title={conversationTitle}
              afterPinActions={
                <>
                  <IconButton
                    size="small"
                    aria-label={t('conversation.call.start')}
                    title={t('conversation.call.start')}
                    onClick={() => void handleStartCall()}
                  >
                    <Phone size={16} />
                  </IconButton>
                  {isGroup && (
                    <IconButton
                      size="small"
                      aria-label={t('conversation.participantsTitle')}
                      title={t('conversation.participantsTitle')}
                      onClick={toggleMembersOpen}
                    >
                      <Users size={16} />
                    </IconButton>
                  )}
                </>
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
          )}
        </div>

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
