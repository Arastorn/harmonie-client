import type { KeyboardEvent, ReactNode } from 'react';

export interface ClickableRowCardProps {
  children: ReactNode;
  className?: string;
  onClick: () => void;
}

export const ClickableRowCard = ({ children, className = '', onClick }: ClickableRowCardProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onClick();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`w-full cursor-pointer rounded-md border border-border-2 bg-surface-2 px-3 py-3 text-left transition-colors hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:shadow-[0_0_8px_color-mix(in_srgb,var(--color-primary)_70%,transparent)] ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
};
