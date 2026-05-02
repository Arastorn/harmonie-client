import { useRef } from 'react';
import { Pencil, SmilePlus, Trash2 } from 'lucide-react';
import { IconButton } from '@harmonie/ui';

interface MessageActionsProps {
  canEdit: boolean;
  canDelete: boolean;
  canReact: boolean;
  editLabel: string;
  deleteLabel: string;
  reactLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  onPickerOpen: (rect: DOMRect) => void;
}

export const MessageActions = ({
  canEdit,
  canDelete,
  canReact,
  editLabel,
  deleteLabel,
  reactLabel,
  onEdit,
  onDelete,
  onPickerOpen,
}: MessageActionsProps) => {
  const reactButtonRef = useRef<HTMLDivElement>(null);

  if (!canEdit && !canDelete && !canReact) return null;

  const handleReactClick = () => {
    const rect = reactButtonRef.current?.getBoundingClientRect();
    if (rect) onPickerOpen(rect);
  };

  return (
    <div className="absolute right-2 -top-3 flex gap-0.5 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-surface-1 border border-border-2 rounded-full shadow-sm">
      {canReact && (
        <div ref={reactButtonRef}>
          <IconButton size="medium" title={reactLabel} onClick={handleReactClick}>
            <SmilePlus size={16} />
          </IconButton>
        </div>
      )}
      {canEdit && (
        <IconButton size="medium" title={editLabel} onClick={onEdit}>
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
