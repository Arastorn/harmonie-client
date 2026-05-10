import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, X } from 'lucide-react';
import { IconButton, UserListItem, UserPopover, type UserPopoverAction } from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import type { ConversationParticipant } from '@/types/conversation';
import { useTheme } from '@/features/user/ThemeContext';
import { getUserGradient } from '@/shared/utils/user';
import { useUser } from '@/features/user/UserContext';
import { useOpenDirectConversation } from '../useOpenDirectConversation';

interface SelectedParticipant {
  participant: ConversationParticipant;
  rect: DOMRect;
}

const ConversationParticipantItem = ({
  participant,
  onSelect,
}: {
  participant: ConversationParticipant;
  onSelect: (participant: ConversationParticipant, rect: DOMRect) => void;
}) => {
  const avatarUrl = useFileBlobUrl(participant.avatarFileId ?? null);
  const label = participant.displayName ?? participant.username;

  return (
    <UserListItem
      user={participant}
      label={label}
      subtitle={participant.displayName ? `@${participant.username}` : undefined}
      avatarUrl={avatarUrl}
      avatarIcon={participant.avatar?.icon ?? 'PawPrint'}
      avatarColor={participant.avatar?.color ?? 'var(--color-cat-1-fg)'}
      avatarBg={participant.avatar?.bg ?? 'var(--color-cat-1)'}
      onSelect={onSelect}
    />
  );
};

export const ConversationParticipantPopover = ({
  participant,
  anchorRect,
  onClose,
  side = 'left',
}: {
  participant: ConversationParticipant;
  anchorRect: DOMRect;
  onClose: () => void;
  side?: 'left' | 'right';
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useUser();
  const openDirectConversation = useOpenDirectConversation();
  const avatarUrl = useFileBlobUrl(participant.avatarFileId ?? null);
  const label = participant.displayName ?? participant.username;
  const actions: UserPopoverAction[] =
    user?.userId === participant.userId
      ? []
      : [
          {
            label: t('conversation.sendDirectMessage'),
            icon: <MessageCircle size={13} />,
            onClick: () => {
              void openDirectConversation(participant)
                .then(onClose)
                .catch(() => {});
            },
          },
        ];

  return (
    <UserPopover
      anchorRect={anchorRect}
      onClose={onClose}
      label={label}
      username={participant.displayName ? participant.username : undefined}
      avatarUrl={avatarUrl}
      avatarIcon={participant.avatar?.icon ?? 'PawPrint'}
      avatarColor={participant.avatar?.color ?? 'var(--color-cat-1-fg)'}
      avatarBg={participant.avatar?.bg ?? 'var(--color-cat-1)'}
      headerBackground={getUserGradient(participant.userId, theme.endsWith('obsidian'))}
      side={side}
      bioLabel={t('guild.members.popover.bioLabel')}
      bio={participant.bio}
      actions={actions}
    />
  );
};

interface ConversationParticipantsPanelProps {
  participants: ConversationParticipant[];
  onClose: () => void;
}

export const ConversationParticipantsPanel = ({
  participants,
  onClose,
}: ConversationParticipantsPanelProps) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<SelectedParticipant | null>(null);

  const handleSelect = (participant: ConversationParticipant, rect: DOMRect) => {
    setSelected((prev) =>
      prev?.participant.userId === participant.userId ? null : { participant, rect }
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-surface-1 lg:static lg:z-auto lg:w-52 lg:shrink-0 lg:rounded-md">
        <div className="flex h-14 shrink-0 items-center justify-between bg-surface-2 px-4 pt-[env(safe-area-inset-top)] lg:rounded-t-md lg:pt-0">
          <span className="text-sm font-semibold text-text-1">
            {t('conversation.participantsTitle')}
          </span>
          <IconButton size="small" onClick={onClose}>
            <X size={14} />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {participants.map((participant) => (
            <ConversationParticipantItem
              key={participant.userId}
              participant={participant}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      {selected && (
        <ConversationParticipantPopover
          participant={selected.participant}
          anchorRect={selected.rect}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
};
