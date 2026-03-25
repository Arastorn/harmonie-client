import { useEffect, useRef, useState } from 'react';
import type { UserTypingEvent } from '@/types/channel';
import type { HubConnection } from '@microsoft/signalr';

interface UseChannelTypingParams {
  channelId?: string;
  channelReady: boolean;
  connection: HubConnection | null;
  currentUserId?: string;
}

export const useChannelTyping = ({
  channelId,
  channelReady,
  connection,
  currentUserId,
}: UseChannelTypingParams) => {
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setTypingUserIds([]);
    typingTimeoutsRef.current.forEach(clearTimeout);
    typingTimeoutsRef.current.clear();
  }, [channelId]);

  useEffect(() => {
    if (!connection || !channelId || !channelReady) return;

    const handleUserTyping = (event: UserTypingEvent) => {
      if (event.channelId !== channelId || event.userId === currentUserId) return;

      setTypingUserIds((prev) => (prev.includes(event.userId) ? prev : [...prev, event.userId]));

      const existing = typingTimeoutsRef.current.get(event.userId);
      if (existing) clearTimeout(existing);

      const timeout = setTimeout(() => {
        setTypingUserIds((prev) => prev.filter((id) => id !== event.userId));
        typingTimeoutsRef.current.delete(event.userId);
      }, 6000);

      typingTimeoutsRef.current.set(event.userId, timeout);
    };

    connection.on('UserTyping', handleUserTyping);

    return () => {
      connection.off('UserTyping', handleUserTyping);
    };
  }, [channelId, channelReady, connection, currentUserId]);

  return { typingUserIds };
};
