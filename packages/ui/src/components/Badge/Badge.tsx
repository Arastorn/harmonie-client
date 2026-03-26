import type { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'owner' | 'filter';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: ReactNode;
  onRemove?: () => void;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-2 text-text-2 border-border-2',
  owner: 'bg-primary/15 text-primary border-primary/30',
  filter: 'bg-primary/20 text-text-1 border-primary/25',
};

export const Badge = ({
  children,
  variant = 'default',
  className = '',
  icon,
  onRemove,
}: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center self-start gap-1 px-2 py-0.5 rounded-sm text-xs font-medium capitalize border ${variantClasses[variant]} ${className}`}
    >
      {icon}
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          className="ml-0.5 text-text-3 hover:text-text-1 cursor-pointer"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      )}
    </span>
  );
};
