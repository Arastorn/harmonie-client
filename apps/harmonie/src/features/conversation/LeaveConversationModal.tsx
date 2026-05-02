import { useTranslation } from 'react-i18next';
import { Button, Modal } from '@harmonie/ui';

interface LeaveConversationModalProps {
  isLeaving: boolean;
  error: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LeaveConversationModal = ({
  isLeaving,
  error,
  onClose,
  onConfirm,
}: LeaveConversationModalProps) => {
  const { t } = useTranslation();

  return (
    <Modal title={t('conversation.leaveTitle')} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="font-body text-sm text-text-2">{t('conversation.leaveConfirm')}</p>
        {error && <p className="font-body text-sm text-error-fg">{t('conversation.leaveError')}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="tertiary" onClick={onClose}>
            {t('conversation.cancel')}
          </Button>
          <Button type="button" variant="danger" isLoading={isLeaving} onClick={onConfirm}>
            {t('conversation.leaveConfirmButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
