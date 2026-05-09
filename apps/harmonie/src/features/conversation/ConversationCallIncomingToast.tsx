import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@harmonie/ui';
import { Phone, PhoneIncoming, PhoneOff } from 'lucide-react';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { useUser } from '@/features/user/UserContext';
import { useVoicePresence } from '@/shared/voice/context/VoicePresenceContext';
import type { ConversationCallIncomingEvent } from '@/types/conversation';
import { useConversations } from './ConversationContext';
import {
  sendAcceptConversationCall,
  sendDeclineConversationCall,
  subscribeConversationCallEvents,
} from './conversationCallRealtime';
import { getConversationLabel } from './conversationUtils';

export const ConversationCallIncomingToast = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { connection } = useRealtime();
  const { user } = useUser();
  const { conversations } = useConversations();
  const voice = useVoicePresence();
  const [incomingCall, setIncomingCall] = useState<ConversationCallIncomingEvent | null>(null);

  const conversation = useMemo(
    () =>
      incomingCall
        ? conversations?.find((item) => item.conversationId === incomingCall.conversationId)
        : null,
    [conversations, incomingCall]
  );
  const conversationTitle = useMemo(() => {
    if (!incomingCall) return '';
    if (conversation) return getConversationLabel(conversation, user?.userId);
    return incomingCall.conversationName ?? incomingCall.conversationId;
  }, [conversation, incomingCall, user?.userId]);

  useEffect(() => {
    if (!connection || !user?.userId) return;

    const handleIncomingCall = (event: ConversationCallIncomingEvent) => {
      if (event.callerUserId === user.userId) return;
      if (voice.activeConversationId === event.conversationId) return;
      setIncomingCall(event);
    };
    const handleCallClosed = (event: { conversationId: string }) => {
      setIncomingCall((current) =>
        current?.conversationId === event.conversationId ? null : current
      );
    };

    return subscribeConversationCallEvents(connection, {
      onIncoming: handleIncomingCall,
      onClosed: handleCallClosed,
    });
  }, [connection, user?.userId, voice.activeConversationId]);

  if (!incomingCall) return null;

  const handleAcceptCall = async () => {
    setIncomingCall(null);
    void sendAcceptConversationCall(connection, incomingCall.conversationId);
    navigate(`/conversations/${incomingCall.conversationId}`);
    await voice.joinConversation(incomingCall.conversationId, conversationTitle);
    voice.updateActiveConversationMeta(conversationTitle);
  };

  const handleDeclineCall = () => {
    setIncomingCall(null);
    void sendDeclineConversationCall(connection, incomingCall.conversationId);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 rounded-md border border-primary/40 bg-surface-2 p-4 shadow-[0_10px_32px_rgba(61,53,48,0.22)]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg">
          <PhoneIncoming size={19} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-1">
            {t('conversation.call.incomingTitle', {
              name: incomingCall.callerDisplayName ?? incomingCall.callerUsername,
            })}
          </p>
          <p className="truncate text-xs text-text-3">{conversationTitle}</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="tertiary" onClick={handleDeclineCall}>
          <PhoneOff size={16} />
          <span>{t('conversation.call.decline')}</span>
        </Button>
        <Button variant="primary" onClick={() => void handleAcceptCall()}>
          <Phone size={16} />
          <span>{t('conversation.call.answer')}</span>
        </Button>
      </div>
    </div>
  );
};
