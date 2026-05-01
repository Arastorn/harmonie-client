import { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export interface AvatarProps {
  avatarUrl?: string;
  alt?: string;
  icon?: string;
  color?: string;
  bg?: string;
  size?: number;
  fallback?: string;
}

export const Avatar = ({
  avatarUrl,
  alt = '',
  icon,
  color,
  bg,
  size = 32,
  fallback,
}: AvatarProps) => {
  const dimension = `${size}px`;
  const iconSize = Math.round(size * 0.7);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={alt}
        style={{
          width: dimension,
          height: dimension,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  const Icon = icon ? (LucideIcons as unknown as Record<string, LucideIcon>)[icon] : undefined;

  if (Icon) {
    return (
      <div
        style={{
          width: dimension,
          height: dimension,
          borderRadius: '50%',
          backgroundColor: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={iconSize} color={color} />
      </div>
    );
  }

  if (fallback) {
    const fontSize = Math.max(8, Math.round(size * 0.4));
    return (
      <div
        style={{
          width: dimension,
          height: dimension,
          borderRadius: '50%',
          fontSize: `${fontSize}px`,
          flexShrink: 0,
        }}
        className="bg-surface-3 flex items-center justify-center font-semibold text-text-2"
      >
        {fallback[0]?.toUpperCase()}
      </div>
    );
  }

  return null;
};
