import { Hash, Settings, Volume2 } from 'lucide-react';
import { IconButton } from '../IconButton/IconButton';

export type ChannelType = 'text' | 'voice';

export interface ChannelItemProps {
  type: ChannelType;
  label: string;
  active?: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onMenuClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  menuLabel?: string;
}

export const ChannelItem = ({
  type,
  label,
  active = false,
  onClick,
  onContextMenu,
  onMenuClick,
  menuLabel,
}: ChannelItemProps) => {
  const Icon = type === 'text' ? Hash : Volume2;
  const baseStateClasses = active
    ? 'bg-surface-2 text-text-1 font-medium'
    : 'text-text-2 hover:bg-surface-2 hover:text-text-1 hover:bg-opacity-70';

  return (
    <div className={['group flex items-center gap-1 rounded-sm', baseStateClasses].join(' ')}>
      <button
        onClick={onClick}
        onContextMenu={onContextMenu}
        className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1 text-sm font-body transition-colors text-left cursor-pointer"
      >
        <Icon size={16} className="shrink-0 text-text-3" />
        <span className="truncate">{label}</span>
      </button>

      {onMenuClick && (
        <IconButton
          size="small"
          variant="overlay"
          aria-label={menuLabel}
          title={menuLabel}
          onClick={(e) => {
            e.stopPropagation();
            onMenuClick(e);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className={[
            'shrink-0 basis-7 min-w-7 min-h-7 transition-all',
            'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus:opacity-100 focus:pointer-events-auto',
            active
              ? 'text-text-2 hover:bg-surface-3'
              : 'text-text-3 hover:bg-surface-2 hover:text-text-1',
          ].join(' ')}
        >
          <Settings size={14} className="shrink-0" />
        </IconButton>
      )}
    </div>
  );
};
