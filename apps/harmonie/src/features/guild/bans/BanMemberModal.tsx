import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Modal } from '@harmonie/ui';
import { banMember } from '@/api/guilds';
import type { GuildMember } from '@/types/guild';

interface BanMemberModalProps {
  guildId: string;
  member: GuildMember;
  onClose: () => void;
  onBanned: (userId: string) => void;
}

export const BanMemberModal = ({ guildId, member, onClose, onBanned }: BanMemberModalProps) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [isBanning, setIsBanning] = useState(false);
  const [error, setError] = useState(false);

  const label = member.displayName ?? member.username;

  const handleBan = async () => {
    setIsBanning(true);
    setError(false);
    try {
      await banMember(guildId, {
        userId: member.userId,
        reason: reason.trim() || null,
        purgeMessagesDays: 0,
      });
      onBanned(member.userId);
    } catch {
      setError(true);
      setIsBanning(false);
    }
  };

  return (
    <Modal
      title={t('guild.bans.modalTitle', { name: label })}
      onClose={onClose}
      closeLabel={t('guild.bans.cancel')}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-2">{t('guild.bans.modalDescription', { name: label })}</p>

        <Input
          label={t('guild.bans.reasonLabel')}
          placeholder={t('guild.bans.reasonPlaceholder')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {error && <p className="text-sm text-error-fg">{t('guild.bans.error')}</p>}

        <div className="flex gap-2 justify-end">
          <Button variant="tertiary" onClick={onClose} disabled={isBanning}>
            {t('guild.bans.cancel')}
          </Button>
          <Button variant="danger" isLoading={isBanning} onClick={handleBan}>
            {t('guild.bans.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
