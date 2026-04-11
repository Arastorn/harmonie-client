import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { IconButton } from '@harmonie/ui';
import { MemberItem } from '@/shared/members/MemberItem';
import { MemberPopover } from '@/shared/members/MemberPopover';
import type { GuildMember } from '@/types/guild';
import type { ConversationParticipant } from '@/types/conversation';
import { participantToMember } from '../conversationUtils';

interface SelectedMember {
  member: GuildMember;
  rect: DOMRect;
}

interface ConversationParticipantsPanelProps {
  participants: ConversationParticipant[];
  onClose: () => void;
}

export const ConversationParticipantsPanel = ({
  participants,
  onClose,
}: ConversationParticipantsPanelProps) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<SelectedMember | null>(null);

  const handleSelect = (member: GuildMember, rect: DOMRect) => {
    setSelected((prev) => (prev?.member.userId === member.userId ? null : { member, rect }));
  };

  const members = participants.map(participantToMember);

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
          {members.map((m) => (
            <MemberItem key={m.userId} member={m} onSelect={handleSelect} />
          ))}
        </div>
      </div>

      {selected && (
        <MemberPopover
          member={selected.member}
          anchorRect={selected.rect}
          onClose={() => setSelected(null)}
          side="left"
        />
      )}
    </>
  );
};
