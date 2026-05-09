import { useTranslation } from 'react-i18next';
import { Pencil, Pin, PinOff, Reply, Trash2 } from 'lucide-react';
import { ContextMenu } from '@harmonie/ui';

export interface MessageMenuState {
  messageId: string;
  position: { x: number; y: number };
  horizontalAnchor?: 'left' | 'right';
  isPinned: boolean;
  canReply: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface MessageContextMenuProps {
  menu: MessageMenuState | null;
  onClose: () => void;
  onReply: (messageId: string) => void;
  onEdit: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onPinToggle: (messageId: string, isPinned: boolean) => void;
}

export const MessageContextMenu = ({
  menu,
  onClose,
  onReply,
  onEdit,
  onDelete,
  onPinToggle,
}: MessageContextMenuProps) => {
  const { t } = useTranslation();

  if (!menu) return null;

  return (
    <ContextMenu
      position={menu.position}
      onClose={onClose}
      horizontalAnchor={menu.horizontalAnchor}
      items={[
        ...(menu.canReply
          ? [
              {
                label: t('channel.messages.reply'),
                icon: <Reply size={14} />,
                onClick: () => onReply(menu.messageId),
              },
            ]
          : []),
        ...(menu.canEdit
          ? [
              {
                label: t('channel.messages.edit'),
                icon: <Pencil size={14} />,
                onClick: () => onEdit(menu.messageId),
              },
            ]
          : []),
        {
          label: menu.isPinned ? t('channel.messages.unpin') : t('channel.messages.pin'),
          icon: menu.isPinned ? <PinOff size={14} /> : <Pin size={14} />,
          onClick: () => onPinToggle(menu.messageId, !menu.isPinned),
        },
        ...(menu.canDelete
          ? [
              {
                label: t('channel.messages.delete'),
                icon: <Trash2 size={14} />,
                onClick: () => onDelete(menu.messageId),
              },
            ]
          : []),
      ]}
    />
  );
};
