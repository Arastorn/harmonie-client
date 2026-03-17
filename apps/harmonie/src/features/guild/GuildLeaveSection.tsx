import { useState } from 'react';
import { DoorOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@harmonie/ui';
import { leaveGuild } from '@/api/guilds';

interface GuildLeaveSectionProps {
  guildId: string;
  onLeave: (guildId: string) => void;
}

export const GuildLeaveSection = ({ guildId, onLeave }: GuildLeaveSectionProps) => {
  const { t } = useTranslation();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState(false);

  const handleLeave = async () => {
    setIsLeaving(true);
    setLeaveError(false);
    try {
      await leaveGuild(guildId);
      onLeave(guildId);
    } catch {
      setLeaveError(true);
      setIsLeaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-2">{t('guild.edit.leaveDescription')}</p>

      {leaveError && <p className="text-sm text-error-fg">{t('guild.edit.leaveError')}</p>}

      {confirmLeave ? (
        <div className="flex gap-2">
          <Button variant="tertiary" onClick={() => setConfirmLeave(false)} disabled={isLeaving}>
            {t('guild.edit.leaveCancel')}
          </Button>
          <Button variant="danger" isLoading={isLeaving} onClick={handleLeave}>
            {t('guild.edit.leaveConfirm')}
          </Button>
        </div>
      ) : (
        <div>
          <Button variant="danger" onClick={() => setConfirmLeave(true)}>
            <DoorOpen size={14} />
            {t('guild.edit.leaveButton')}
          </Button>
        </div>
      )}
    </div>
  );
};
