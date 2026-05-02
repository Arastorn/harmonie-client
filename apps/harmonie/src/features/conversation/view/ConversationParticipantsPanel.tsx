import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { IconButton, UserListItem, UserPopover } from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import type { ConversationParticipant } from '@/types/conversation';
import { useTheme } from '@/features/user/ThemeContext';
import { getUserGradient } from '@/shared/utils/user';

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
  const avatarUrl = useFileBlobUrl(participant.avatarFileId ?? null);
  const label = participant.displayName ?? participant.username;

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
      <div className="w-52 flex flex-col shrink-0 bg-surface-1 rounded-md overflow-hidden">
        <div className="flex items-center justify-between px-4 h-14 shrink-0 bg-surface-2 rounded-t-md">
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
