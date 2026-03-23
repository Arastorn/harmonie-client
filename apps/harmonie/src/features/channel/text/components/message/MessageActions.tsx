import { Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@harmonie/ui';

interface MessageActionsProps {
  canEdit: boolean;
  canDelete: boolean;
  editLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const MessageActions = ({
  canEdit,
  canDelete,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: MessageActionsProps) => {
  if (!canEdit && !canDelete) return null;

  return (
    <div className="absolute right-2 -top-3 flex opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-surface-1 border border-border-2 rounded-sm shadow-sm">
      {canEdit && (
        <IconButton size="small" title={editLabel} onClick={onEdit}>
          <Pencil size={14} />
        </IconButton>
      )}
      {canDelete && (
        <IconButton size="small" title={deleteLabel} onClick={onDelete}>
          <Trash2 size={14} />
        </IconButton>
      )}
    </div>
  );
};
