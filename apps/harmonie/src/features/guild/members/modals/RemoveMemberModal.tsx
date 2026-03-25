import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from '@harmonie/ui';
import { removeMember } from '@/api/guilds';
import type { GuildMember } from '@/types/guild';

interface RemoveMemberModalProps {
  guildId: string;
  member: GuildMember;
  onClose: () => void;
  onRemoved: (userId: string) => void;
}

export const RemoveMemberModal = ({
  guildId,
  member,
  onClose,
  onRemoved,
}: RemoveMemberModalProps) => {
  const { t } = useTranslation();
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState(false);

  const label = member.displayName ?? member.username;

  const handleRemove = async () => {
    setIsRemoving(true);
    setError(false);
    try {
      await removeMember(guildId, member.userId);
      onRemoved(member.userId);
    } catch {
      setError(true);
      setIsRemoving(false);
    }
  };

  return (
    <Modal
      title={t('guild.members.removeModal.title', { name: label })}
      onClose={onClose}
      closeLabel={t('guild.members.removeModal.cancel')}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-2">
          {t('guild.members.removeModal.description', { name: label })}
        </p>

        {error && <p className="text-sm text-error-fg">{t('guild.members.removeModal.error')}</p>}

        <div className="flex gap-2 justify-end">
          <Button variant="tertiary" onClick={onClose} disabled={isRemoving}>
            {t('guild.members.removeModal.cancel')}
          </Button>
          <Button variant="danger" isLoading={isRemoving} onClick={handleRemove}>
            {t('guild.members.removeModal.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
