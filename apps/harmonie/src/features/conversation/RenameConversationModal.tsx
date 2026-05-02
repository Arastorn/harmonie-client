import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Modal } from '@harmonie/ui';
import type { Conversation } from '@/types/conversation';

interface RenameConversationModalProps {
  conversation: Conversation;
  isSaving: boolean;
  error: boolean;
  onClose: () => void;
  onSave: (name: string | null) => void;
  onChange: () => void;
}

export const RenameConversationModal = ({
  conversation,
  isSaving,
  error,
  onClose,
  onSave,
  onChange,
}: RenameConversationModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState(conversation.name ?? '');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const rawName = formData.get('conversationName');
    const trimmedName = typeof rawName === 'string' ? rawName.trim() : '';
    onSave(trimmedName === '' ? null : trimmedName);
  };

  return (
    <Modal title={t('conversation.renameTitle')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          key={conversation.conversationId}
          name="conversationName"
          label={t('conversation.nameLabel')}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            onChange();
          }}
          error={error ? t('conversation.renameError') : undefined}
          placeholder={t('conversation.namePlaceholder')}
          autoFocus
          maxLength={100}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="tertiary" onClick={onClose}>
            {t('conversation.cancel')}
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {t('conversation.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
