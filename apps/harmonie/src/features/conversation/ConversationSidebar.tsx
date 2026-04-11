import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ConversationItem, IconButton } from '@harmonie/ui';
import { Plus } from 'lucide-react';
import { deleteConversation } from '@/api/conversations';
import { useMessageActivity } from '@/features/realtime/MessageActivityContext';
import { useUser } from '@/features/user/UserContext';
import { useConversations } from './ConversationContext';
import { ConversationAvatar } from './avatar/ConversationAvatar';
import { NewConversationModal } from './create/NewConversationModal';
import { getConversationLabel } from './conversationUtils';

export const ConversationSidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { conversationId: activeConversationId } = useParams<{ conversationId: string }>();
  const { conversations, fetchConversations, removeConversation } = useConversations();
  const { hasUnreadConversation } = useMessageActivity();
  const { user } = useUser();
  const [showNewConversation, setShowNewConversation] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleDelete = (conversationId: string) => {
    deleteConversation(conversationId)
      .then(() => {
        removeConversation(conversationId);
        if (activeConversationId === conversationId) {
          navigate('/conversations');
        }
      })
      .catch(() => {});
  };

  const isLoading = conversations === null || user === null;

  return (
    <>
      <aside className="flex flex-col w-60 bg-surface-1 rounded-md shrink-0 overflow-hidden min-h-0">
        <header className="pl-4 pr-2 h-14 bg-surface-2 rounded-t-md flex items-center justify-between gap-2">
          <h2 className="font-semibold text-text-1 truncate">{t('conversation.home')}</h2>
          <IconButton
            size="small"
            variant="ghost"
            onClick={() => setShowNewConversation(true)}
            aria-label={t('conversation.newConversation')}
            title={t('conversation.newConversation')}
          >
            <Plus size={14} />
          </IconButton>
        </header>

        <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5">
          {isLoading ? (
            <div className="flex flex-col gap-2 px-2 pt-1 animate-pulse">
              <div className="h-8 rounded bg-border-2" />
              <div className="h-8 rounded bg-border-2" />
              <div className="h-8 rounded bg-border-2" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-text-3 px-2 py-2">{t('conversation.selectPlaceholder')}</p>
          ) : (
            conversations.map((conv) => {
              const label = getConversationLabel(conv, user.userId);
              return (
                <ConversationItem
                  key={conv.conversationId}
                  avatar={
                    <ConversationAvatar
                      conversation={conv}
                      label={label}
                      currentUserId={user.userId}
                    />
                  }
                  label={label}
                  active={conv.conversationId === activeConversationId}
                  unread={hasUnreadConversation(conv.conversationId)}
                  onClick={() => navigate(`/conversations/${conv.conversationId}`)}
                  onDeleteClick={() => handleDelete(conv.conversationId)}
                  deleteLabel={t('conversation.delete')}
                />
              );
            })
          )}
        </div>
      </aside>

      {showNewConversation && (
        <NewConversationModal onClose={() => setShowNewConversation(false)} />
      )}
    </>
  );
};
