import { useTranslation } from 'react-i18next';
import { Hash, Paperclip } from 'lucide-react';
import { Avatar } from '@harmonie/ui';
import type { GuildMessageSearchItem } from '@/types/guild';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { formatContextualDateTime } from '@/shared/utils/date';

interface GuildSearchResultItemProps {
  item: GuildMessageSearchItem;
  onClick: () => void;
  language: string;
}

export const GuildSearchResultItem = ({ item, onClick, language }: GuildSearchResultItemProps) => {
  const { t } = useTranslation();
  const avatarUrl = useFileBlobUrl(item.authorAvatarFileId);

  return (
    <button
      type="button"
      className="w-full text-left px-3 py-2 hover:bg-surface-hover transition-colors rounded-md cursor-pointer ring-1 ring-primary/10"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <div className="shrink-0 mt-0.5">
          <Avatar
            avatarUrl={avatarUrl}
            icon={item.authorAvatar?.icon ?? undefined}
            color={item.authorAvatar?.color ?? undefined}
            bg={item.authorAvatar?.bg ?? undefined}
            size={24}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-semibold text-text-1 truncate">
              {item.authorDisplayName ?? item.authorUsername}
            </span>
            <span className="text-xs text-text-3 flex items-center gap-0.5 shrink-0">
              <Hash size={10} />
              {item.channelName}
            </span>
          </div>
          <p className="text-xs text-text-2 line-clamp-2 wrap-break-word">{item.content}</p>
          {item.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-text-3 mt-0.5">
              <Paperclip size={10} />
              {item.attachments.length}
            </span>
          )}
          <span className="text-[10px] text-text-3">
            {formatContextualDateTime(item.createdAtUtc, language, t)}
          </span>
        </div>
      </div>
    </button>
  );
};
