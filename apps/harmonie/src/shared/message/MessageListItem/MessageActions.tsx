import { useRef } from 'react';
import { Pencil, Pin, PinOff, SmilePlus, Trash2 } from 'lucide-react';
import { IconButton } from '@harmonie/ui';

interface MessageActionsProps {
  canEdit: boolean;
  canDelete: boolean;
  canPin: boolean;
  isPinned: boolean;
  canReact: boolean;
  editLabel: string;
  deleteLabel: string;
  pinLabel: string;
  unpinLabel: string;
  reactLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  onPinToggle: () => void;
  onPickerOpen: (rect: DOMRect) => void;
}

export const MessageActions = ({
  canEdit,
  canDelete,
  canPin,
  isPinned,
  canReact,
  editLabel,
  deleteLabel,
  pinLabel,
  unpinLabel,
  reactLabel,
  onEdit,
  onDelete,
  onPinToggle,
  onPickerOpen,
}: MessageActionsProps) => {
  const reactButtonRef = useRef<HTMLDivElement>(null);

  if (!canEdit && !canDelete && !canPin && !canReact) return null;

  const visibleActionCount = [canReact, canPin, canEdit, canDelete].filter(Boolean).length;
  const singleActionTooltipSide = visibleActionCount === 1 ? 'left' : undefined;

  const handleReactClick = () => {
    const rect = reactButtonRef.current?.getBoundingClientRect();
    if (rect) onPickerOpen(rect);
  };

  return (
    <div className="absolute right-2 -top-3 flex gap-0.5 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-surface-1 border border-border-2 rounded-full shadow-sm">
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
