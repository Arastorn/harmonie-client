import { useTranslation } from 'react-i18next';

export const ConversationIndexPage = () => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full items-center justify-center text-text-3 text-sm bg-surface-1 rounded-md">
      {t('conversation.selectPlaceholder')}
    </div>
  );
};
