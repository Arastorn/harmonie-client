import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Modal } from '@harmonie/ui';
import type { PinnedMessage, PinnedMessageList } from '@/types/channel';
import type { MessageAuthor } from '@/shared/message/types';
import { PinnedMessageRow } from './PinnedMessageRow';

interface PinnedMessagesModalProps {
  entityId: string;
  title: string;
  emptyLabel: string;
  errorLabel: string;
  loadingLabel: string;
  loadMoreLabel: string;
  closeLabel: string;
  fetchPinnedMessages: (entityId: string, cursor?: string | null) => Promise<PinnedMessageList>;
  authorMap?: ReadonlyMap<string, MessageAuthor>;
  onMessageSelected: (messageId: string) => Promise<void> | void;
  onMessageUnpinned: (messageId: string) => Promise<void> | void;
  onClose: () => void;
}

export const PinnedMessagesModal = ({
  entityId,
  title,
  emptyLabel,
  errorLabel,
  loadingLabel,
  loadMoreLabel,
  closeLabel,
  fetchPinnedMessages,
  authorMap,
  onMessageSelected,
  onMessageUnpinned,
  onClose,
}: PinnedMessagesModalProps) => {
  const [items, setItems] = useState<PinnedMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const loadPage = useCallback(
    async (cursor?: string | null) => {
      if (cursor) setLoadingMore(true);
      else setLoading(true);
      setError(false);
      try {
        const data = await fetchPinnedMessages(entityId, cursor);
        setItems((prev) => (cursor ? [...prev, ...data.items] : data.items));
        setNextCursor(data.nextCursor);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [entityId, fetchPinnedMessages]
  );

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const dedupedItems = useMemo(() => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.messageId)) return false;
      seen.add(item.messageId);
      return true;
    });
  }, [items]);

  const handleSelect = async (messageId: string) => {
    await onMessageSelected(messageId);
    onClose();
  };

  const handleUnpin = async (messageId: string) => {
    await onMessageUnpinned(messageId);
    setItems((prev) => prev.filter((item) => item.messageId !== messageId));
  };

  return (
    <Modal title={title} closeLabel={closeLabel} onClose={onClose} maxWidth="max-w-2xl">
      {loading ? (
        <div className="py-8 text-center text-sm text-text-3">{loadingLabel}</div>
      ) : error ? (
        <div className="py-8 text-center text-sm text-error-fg">{errorLabel}</div>
      ) : dedupedItems.length === 0 ? (
        <div className="py-8 text-center text-sm text-text-3">{emptyLabel}</div>
      ) : (
        <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
          {dedupedItems.map((message) => (
            <PinnedMessageRow
              key={message.messageId}
              message={message}
              member={authorMap?.get(message.authorUserId)}
              onSelect={handleSelect}
              onUnpin={(messageId) => void handleUnpin(messageId)}
            />
          ))}
          {nextCursor && (
            <Button
              variant="tertiary"
              isLoading={loadingMore}
              onClick={() => void loadPage(nextCursor)}
            >
              {loadMoreLabel}
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
};
