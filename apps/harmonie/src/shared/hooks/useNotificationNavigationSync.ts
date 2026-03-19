import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NOTIFICATION_NAVIGATE_EVENT } from '@/shared/notifications/browserNotification';

export const useNotificationNavigationSync = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleNotificationNavigate = (event: Event) => {
      const targetPath = (event as CustomEvent<string>).detail;
      if (!targetPath) return;
      navigate(targetPath);
    };

    window.addEventListener(NOTIFICATION_NAVIGATE_EVENT, handleNotificationNavigate);
    return () =>
      window.removeEventListener(NOTIFICATION_NAVIGATE_EVENT, handleNotificationNavigate);
  }, [navigate]);
};
