import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ShieldBan } from 'lucide-react';
import { Avatar, Badge, IconButton } from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import type { GuildMember } from '@/types/guild';

const POPOVER_WIDTH = 224;
const POPOVER_OFFSET = 8;

interface MemberPopoverProps {
  member: GuildMember;
  anchorRect: DOMRect;
  onClose: () => void;
  side?: 'left' | 'right';
  onBan?: () => void;
  isOwner?: boolean;
}

export const MemberPopover = ({
  member,
  anchorRect,
  onClose,
  side = 'left',
  onBan,
  isOwner = false,
}: MemberPopoverProps) => {
  const { t } = useTranslation();
  const avatarUrl = useFileBlobUrl(member.avatarFileId);
  const cardRef = useRef<HTMLDivElement>(null);
  const label = member.displayName ?? member.username;

  const top = Math.min(
    anchorRect.top,
    window.innerHeight - (cardRef.current?.offsetHeight ?? 200) - POPOVER_OFFSET
  );
  const left =
    side === 'right'
      ? Math.min(
          anchorRect.right + POPOVER_OFFSET,
          window.innerWidth - POPOVER_WIDTH - POPOVER_OFFSET
        )
      : anchorRect.left - POPOVER_WIDTH - POPOVER_OFFSET;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        ref={cardRef}
        className="fixed z-50 w-56 rounded-md bg-surface-1 border border-border-2 shadow-lg overflow-hidden"
        style={{ top, left }}
      >
        <div className="relative h-9 bg-primary">
          {onBan && (
            <div className="absolute top-1.5 right-1.5">
              <IconButton
                size="small"
                variant="overlay"
                aria-label={t('guild.bans.banAction')}
                title={t('guild.bans.banAction')}
                onClick={() => {
                  onClose();
                  onBan();
                }}
              >
                <ShieldBan size={13} />
              </IconButton>
            </div>
          )}
          <div className="absolute left-4 bottom-0 translate-y-1/2">
            <Avatar
              alt={label}
              avatarUrl={avatarUrl}
              icon={member.avatar?.icon ?? 'PawPrint'}
              color={member.avatar?.color ?? 'var(--color-cat-1-fg)'}
              bg={member.avatar?.bg ?? 'var(--color-cat-1)'}
              size={48}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pt-8 pb-4 flex flex-col gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-1 truncate">{label}</p>
            {member.displayName && (
              <p className="text-xs text-text-3 truncate">@{member.username}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge>{member.role}</Badge>
            {isOwner && <Badge variant="owner">{t('guild.members.popover.ownerLabel')}</Badge>}
          </div>

          {member.bio && (
            <div>
              <p className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-1">
                {t('guild.members.popover.bioLabel')}
              </p>
              <p className="text-xs text-text-2 leading-relaxed whitespace-pre-wrap">
                {member.bio}
              </p>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};
