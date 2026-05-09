import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '../IconButton/IconButton';

export interface ConversationItemProps {
  avatar: ReactNode;
  label: string;
  active?: boolean;
  unread?: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDeleteClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  deleteLabel?: string;
}

export const ConversationItem = ({
  avatar,
  label,
  active = false,
  unread = false,
  onClick,
  onContextMenu,
  onDeleteClick,
  deleteLabel,
}: ConversationItemProps) => {
  const baseStateClasses = active
    ? 'bg-secondary text-secondary-fg font-medium'
    : unread
      ? 'text-text-1 font-extrabold hover:bg-surface-3'
      : 'text-text-2 hover:bg-surface-3 hover:text-text-1';

  return (
    <div
      className={['group flex items-center gap-1 rounded-sm px-1.5 h-9', baseStateClasses].join(
        ' '
      )}
      onContextMenu={onContextMenu}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-2 text-sm font-body text-left cursor-pointer h-9"
      >
        <span
          className={[
            'shrink-0 rounded-full',
            unread && !active
              ? 'ring-2 ring-primary shadow-[0_0_0_2px_rgba(138,173,144,0.18)] drop-shadow-[0_0_12px_var(--color-primary)]'
              : '',
          ].join(' ')}
        >
          {avatar}
        </span>
        <span className="truncate flex-1">{label}</span>
      </button>

      {onDeleteClick && (
        <IconButton
          size="small"
          variant="overlay"
          aria-label={deleteLabel}
          title={deleteLabel}
          tooltipSide="right"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(e);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className={[
            'shrink-0 basis-7 min-w-7 min-h-7 transition-all',
            'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus:opacity-100 focus:pointer-events-auto',
            active ? 'text-secondary-fg hover:bg-secondary' : 'text-text-2',
          ].join(' ')}
        >
          <X size={14} className="shrink-0" />
        </IconButton>
      )}
    </div>
  );
};
