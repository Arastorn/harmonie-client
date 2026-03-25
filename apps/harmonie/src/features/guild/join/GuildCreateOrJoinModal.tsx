import { useTranslation } from 'react-i18next';
import { Modal } from '@harmonie/ui';
import { GuildForm } from '@/features/guild/form/GuildForm';
import { GuildJoinForm } from '@/features/guild/join/GuildJoinForm';

type GuildAccessMode = 'create' | 'join';

interface GuildCreateOrJoinModalProps {
  mode: GuildAccessMode;
  onClose: () => void;
}

export const GuildCreateOrJoinModal = ({ mode, onClose }: GuildCreateOrJoinModalProps) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={
        mode === 'create' ? t('guild.createJoin.createTitle') : t('guild.createJoin.joinTitle')
      }
      onClose={onClose}
      closeLabel={t('guild.createJoin.close')}
      maxWidth="max-w-lg"
    >
      {mode === 'create' ? (
        <GuildForm autoFocus onSuccess={onClose} />
      ) : (
        <GuildJoinForm onSuccess={onClose} />
      )}
    </Modal>
  );
};
