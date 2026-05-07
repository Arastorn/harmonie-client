import { useEffect } from 'react';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
import type { UserProfileUpdatedEvent } from '@/types/user';
import { useUser } from './UserContext';
import { applyCurrentUserProfileUpdate } from '@/features/realtime/userProfileRealtime';

export const UserProfileRealtimeSync = () => {
  const { connection } = useRealtime();
  const { user, updateUser } = useUser();

  useEffect(() => {
    if (!connection || !user) return;

    const handleUserProfileUpdated = (event: UserProfileUpdatedEvent) => {
      if (event.userId !== user.userId) return;
      updateUser(applyCurrentUserProfileUpdate(user, event));
    };

    connection.on(REALTIME_SERVER_EVENTS.userProfileUpdated, handleUserProfileUpdated);

    return () => {
      connection.off(REALTIME_SERVER_EVENTS.userProfileUpdated, handleUserProfileUpdated);
    };
  }, [connection, updateUser, user]);

  return null;
};
