import { useEffect, useRef, useState } from 'react';
import type { HubConnection } from '@microsoft/signalr';

export interface UseTypingParams {
  entityId?: string;
  ready?: boolean;
  connection: HubConnection | null;
  currentUserId?: string;
  eventName: string;
  entityIdField: string;
}

export const useTyping = ({
  entityId,
  ready = true,
  connection,
  currentUserId,
  eventName,
  entityIdField,
}: UseTypingParams) => {
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setTypingUserIds([]);
    typingTimeoutsRef.current.forEach(clearTimeout);
    typingTimeoutsRef.current.clear();
  }, [entityId]);

  useEffect(() => {
    if (!connection || !entityId || !ready) return;

    const handleTyping = (event: Record<string, string>) => {
      if (event[entityIdField] !== entityId || event.userId === currentUserId) return;

      const { userId } = event;
      setTypingUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));

      const existing = typingTimeoutsRef.current.get(userId);
      if (existing) clearTimeout(existing);

      const timeout = setTimeout(() => {
        setTypingUserIds((prev) => prev.filter((id) => id !== userId));
        typingTimeoutsRef.current.delete(userId);
      }, 6000);

      typingTimeoutsRef.current.set(userId, timeout);
    };

    connection.on(eventName, handleTyping);

    return () => {
      connection.off(eventName, handleTyping);
    };
  }, [entityId, ready, connection, currentUserId, eventName, entityIdField]);

  return { typingUserIds };
};
