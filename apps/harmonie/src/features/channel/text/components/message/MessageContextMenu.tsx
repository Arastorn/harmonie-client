import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { ContextMenu } from '@harmonie/ui';

export interface MessageMenuState {
  messageId: string;
  position: { x: number; y: number };
  horizontalAnchor?: 'left' | 'right';
}

interface MessageContextMenuProps {
  menu: MessageMenuState | null;
  onClose: () => void;
  onEdit: (messageId: string) => void;
  onDelete: (messageId: string) => void;
}

export const MessageContextMenu = ({
  menu,
  onClose,
  onEdit,
  onDelete,
}: MessageContextMenuProps) => {
  const { t } = useTranslation();

  if (!menu) return null;

  return (
    <ContextMenu
      position={menu.position}
      onClose={onClose}
      horizontalAnchor={menu.horizontalAnchor}
      items={[
        {
          label: t('channel.messages.edit'),
          icon: <Pencil size={14} />,
          onClick: () => onEdit(menu.messageId),
        },
        {
          label: t('channel.messages.delete'),
          icon: <Trash2 size={14} />,
          onClick: () => onDelete(menu.messageId),
        },
      ]}
    />
  );
};
