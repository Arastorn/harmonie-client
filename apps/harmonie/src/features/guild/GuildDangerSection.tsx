import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@harmonie/ui';
import { deleteGuild } from '@/api/guilds';

interface GuildDangerSectionProps {
  guildId: string;
  onDeleted: (guildId: string) => void;
}

export const GuildDangerSection = ({ guildId, onDeleted }: GuildDangerSectionProps) => {
  const { t } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(false);
    try {
      await deleteGuild(guildId);
      onDeleted(guildId);
    } catch {
      setDeleteError(true);
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-2">{t('guild.edit.deleteDescription')}</p>

      {deleteError && <p className="text-sm text-error-fg">{t('guild.edit.deleteError')}</p>}

      {confirmDelete ? (
        <div className="flex gap-2">
          <Button variant="tertiary" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
            {t('guild.edit.deleteCancel')}
          </Button>
          <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
            {t('guild.edit.deleteConfirm')}
          </Button>
        </div>
      ) : (
        <div>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} />
            {t('guild.edit.deleteButton')}
          </Button>
        </div>
      )}
    </div>
  );
};
