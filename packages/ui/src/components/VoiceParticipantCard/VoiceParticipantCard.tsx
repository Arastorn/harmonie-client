import type { HTMLAttributes } from 'react';
import { Avatar } from '../Avatar/Avatar';

export interface VoiceParticipantCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  avatarLabel: string;
  avatarSize?: number;
  avatarUrl?: string;
  avatarIcon?: string;
  avatarColor?: string;
  avatarBg?: string;
  titleClassName?: string;
  isSpeaking?: boolean;
}

export const VoiceParticipantCard = ({
  title,
  avatarLabel,
  avatarSize = 96,
  avatarUrl,
  avatarIcon,
  avatarColor,
  avatarBg,
  className = '',
  titleClassName = '',
  isSpeaking = false,
  ...props
}: VoiceParticipantCardProps) => {
  const showAvatar = avatarUrl || avatarIcon;

  return (
    <div
      className={[
        'flex flex-col items-center justify-center rounded-md border p-8 text-center transition-all duration-150 hover:scale-[1.01]',
        isSpeaking ? 'border-primary shadow-[0_0_0_2px_var(--color-primary)]' : 'border-border-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {showAvatar ? (
        <div className="mb-6">
          <Avatar
            avatarUrl={avatarUrl}
            icon={avatarIcon}
            color={avatarColor}
            bg={avatarBg}
            size={avatarSize}
            alt={title}
          />
        </div>
      ) : (
        <div
          className="mb-6 flex items-center justify-center rounded-full border border-border-2 bg-surface-1/80 font-semibold text-text-1"
          style={{
            width: avatarSize,
            height: avatarSize,
            fontSize: Math.round(avatarSize * 0.35),
          }}
        >
          {avatarLabel}
        </div>
      )}
      <p
        className={['max-w-full truncate font-medium text-text-1', titleClassName]
          .filter(Boolean)
          .join(' ')}
      >
        {title}
      </p>
    </div>
  );
};
