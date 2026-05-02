import { useTranslation } from 'react-i18next';
import { Button, Modal } from '@harmonie/ui';

interface MessageAttachmentDeleteModalProps {
  fileName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const MessageAttachmentDeleteModal = ({
  fileName,
  onConfirm,
  onClose,
}: MessageAttachmentDeleteModalProps) => {
  const { t } = useTranslation();

  return (
    <Modal title={t('channel.messages.deleteAttachment')} onClose={onClose}>
      <p className="font-body text-sm text-text-2">
        {t('channel.messages.deleteAttachmentConfirm', { name: fileName })}
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="tertiary" onClick={onClose}>
          {t('channel.messages.deleteAttachmentCancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {t('channel.messages.deleteAttachmentConfirmButton')}
        </Button>
      </div>
    </Modal>
  );
};
