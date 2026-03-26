import { useDocumentTitleSync } from '@/shared/hooks/useDocumentTitleSync';
import { useNotificationNavigationSync } from '@/shared/hooks/useNotificationNavigationSync';

export const LayoutSync = () => {
  useDocumentTitleSync();
  useNotificationNavigationSync();
  return null;
};
