import type { HTMLAttributes, ReactNode } from 'react';

export interface RowCardProps extends HTMLAttributes<HTMLLIElement> {
  children: ReactNode;
}

export const RowCard = ({ children, className = '', ...props }: RowCardProps) => (
  <li
    className={`flex items-center gap-3 rounded-md bg-surface-2 px-3 py-2 ${className}`}
    {...props}
  >
    {children}
  </li>
);
