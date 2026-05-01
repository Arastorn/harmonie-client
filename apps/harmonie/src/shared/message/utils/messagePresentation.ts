import { differenceInMinutes, format, isSameDay } from 'date-fns';
import type { Message } from '@/types/channel';

const MESSAGE_GROUPING_WINDOW_MINUTES = 10;

export const areMessagesGrouped = (previousMessage?: Message, currentMessage?: Message) => {
  if (!previousMessage || !currentMessage) return false;
  if (previousMessage.authorUserId !== currentMessage.authorUserId) return false;

  return (
    differenceInMinutes(
      new Date(currentMessage.createdAtUtc),
      new Date(previousMessage.createdAtUtc)
    ) < MESSAGE_GROUPING_WINDOW_MINUTES
  );
};

export const getDaySeparatorLabel = (previousMessage?: Message, currentMessage?: Message) => {
  if (!previousMessage || !currentMessage) return null;

  const previousDate = new Date(previousMessage.createdAtUtc);
  const currentDate = new Date(currentMessage.createdAtUtc);

  if (isSameDay(previousDate, currentDate)) return null;

  return format(currentDate, 'PPP');
};
