import type { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'owner';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-2 text-text-2 border-border-2',
  owner: 'bg-primary/15 text-primary border-primary/30',
};

export const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center self-start px-2 py-0.5 rounded-sm text-xs font-medium capitalize border ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
