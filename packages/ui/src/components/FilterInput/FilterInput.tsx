import type { HTMLAttributes, ReactNode } from 'react';

export interface FilterInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
  rightElement?: ReactNode;
}

export const FilterInput = ({
  children,
  rightElement,
  className = '',
  ...props
}: FilterInputProps) => {
  const classes = [
    'relative flex items-center rounded-sm bg-surface-2 border border-border-2',
    'transition-[border-color,box-shadow] duration-150',
    'focus-within:border-secondary-fg',
    'focus-within:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-secondary-fg)_14%,transparent)]',
    'cursor-text',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      <div className="flex flex-1 min-w-0 items-center gap-1 flex-wrap pl-2 pr-8 py-1 min-h-[30px]">
        {children}
      </div>
      {rightElement && (
        <div className="absolute inset-y-0 right-2.5 my-auto flex items-center text-text-3 pointer-events-none">
          {rightElement}
        </div>
      )}
    </div>
  );
};
