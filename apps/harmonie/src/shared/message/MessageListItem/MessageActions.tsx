import { useRef } from 'react';
import { Pencil, Pin, PinOff, Reply, SmilePlus, Trash2 } from 'lucide-react';
import { IconButton } from '@harmonie/ui';

interface MessageActionsProps {
  canEdit: boolean;
  canDelete: boolean;
  canPin: boolean;
  isPinned: boolean;
  canReact: boolean;
  canReply: boolean;
  editLabel: string;
  deleteLabel: string;
  pinLabel: string;
  unpinLabel: string;
  reactLabel: string;
  replyLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  onPinToggle: () => void;
  onPickerOpen: (rect: DOMRect) => void;
  onReply: () => void;
}

export const MessageActions = ({
  canEdit,
  canDelete,
  canPin,
  isPinned,
  canReact,
  canReply,
  editLabel,
  deleteLabel,
  pinLabel,
  unpinLabel,
  reactLabel,
  replyLabel,
  onEdit,
  onDelete,
  onPinToggle,
  onPickerOpen,
  onReply,
}: MessageActionsProps) => {
  const reactButtonRef = useRef<HTMLDivElement>(null);

  if (!canEdit && !canDelete && !canPin && !canReact && !canReply) return null;

  const visibleActionCount = [canReply, canReact, canPin, canEdit, canDelete].filter(
    Boolean
  ).length;
  const singleActionTooltipSide = visibleActionCount === 1 ? 'left' : undefined;

  const handleReactClick = () => {
    const rect = reactButtonRef.current?.getBoundingClientRect();
    if (rect) onPickerOpen(rect);
  };

  return (
    <div className="absolute right-2 -top-3 hidden gap-0.5 rounded-full border border-border-2 bg-surface-1 p-0.5 opacity-0 shadow-sm transition-opacity z-10 group-hover:opacity-100 md:flex">
      {canReply && (
        <IconButton
          size="medium"
          title={replyLabel}
          tooltipSide={singleActionTooltipSide}
          onClick={onReply}
        >
          <Reply size={16} />
        </IconButton>
      )}
      {canReact && (
        <div ref={reactButtonRef}>
          <IconButton
            size="medium"
            title={reactLabel}
            tooltipSide={singleActionTooltipSide}
            onClick={handleReactClick}
          >
            <SmilePlus size={16} />
          </IconButton>
        </div>
      )}
      {canPin && (
        <IconButton
          size="medium"
          title={isPinned ? unpinLabel : pinLabel}
          tooltipSide={singleActionTooltipSide}
          onClick={onPinToggle}
        >
          {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
        </IconButton>
      )}
      {canEdit && (
        <IconButton
          size="medium"
          title={editLabel}
          tooltipSide={singleActionTooltipSide}
          onClick={onEdit}
        >
          <Pencil size={16} />
        </IconButton>
      )}
      {canDelete && (
        <IconButton size="medium" title={deleteLabel} onClick={onDelete}>
          <Trash2 size={16} />
        </IconButton>
      )}
    </div>
  );
};
