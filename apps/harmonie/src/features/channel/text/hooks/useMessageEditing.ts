import { useCallback, useEffect, useRef, useState } from 'react';
import { updateMessage } from '@/api/channels';
import type { Message } from '@/types/channel';

interface UseMessageEditingParams {
  channelId?: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export const useMessageEditing = ({ channelId, setMessages }: UseMessageEditingParams) => {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const editingMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    editingMessageIdRef.current = editingMessageId;
  }, [editingMessageId]);

  useEffect(() => {
    setEditingMessageId(null);
  }, [channelId]);

  const startEditing = useCallback((messageId: string) => {
    setEditingMessageId(messageId);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingMessageId(null);
  }, []);

  const saveEdit = useCallback(
    async (messageId: string, content: string) => {
      if (!channelId) return;
      const updatedMessage = await updateMessage(channelId, messageId, content);
      setMessages((prev) =>
        prev.map((message) =>
          message.messageId === updatedMessage.messageId
            ? { ...message, ...updatedMessage }
            : message
        )
      );
      setEditingMessageId(null);
    },
    [channelId, setMessages]
  );

  return {
    editingMessageId,
    editingMessageIdRef,
    startEditing,
    cancelEditing,
    saveEdit,
  };
};
