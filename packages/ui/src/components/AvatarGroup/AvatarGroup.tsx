import type { ReactNode } from 'react';

export interface AvatarGroupProps {
  children: ReactNode | ReactNode[];
  size?: number;
}

export const AvatarGroup = ({ children, size = 24 }: AvatarGroupProps) => {
  const items = Array.isArray(children) ? children : [children];
  const dimension = `${size}px`;

  if (items.length <= 1) {
    return <>{items[0]}</>;
  }

  return (
    <div className="relative shrink-0" style={{ width: dimension, height: dimension }}>
      <div className="absolute top-0 left-0">{items[0]}</div>
      <div className="absolute bottom-0 right-0 ring-1 ring-surface-1 rounded-full">{items[1]}</div>
    </div>
  );
};
