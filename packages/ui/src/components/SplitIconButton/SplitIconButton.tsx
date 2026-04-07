import { forwardRef, type ReactNode, type Ref } from 'react';
import type { IconButtonSize } from '../IconButton/IconButton';

export interface SplitIconButtonProps {
  size?: IconButtonSize;
  selected?: boolean;
  open?: boolean;
  disabled?: boolean;
  primaryLabel: string;
  secondaryLabel: string;
  primaryIcon: ReactNode;
  secondaryIcon: ReactNode;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  className?: string;
}

const containerSizeClasses: Record<IconButtonSize, string> = {
  normal: 'h-[30px]',
  small: 'h-[25px]',
  medium: 'h-[36px]',
};

const primarySizeClasses: Record<IconButtonSize, string> = {
  normal: 'w-[30px]',
  small: 'w-[25px]',
  medium: 'w-[36px]',
};

const secondarySizeClasses: Record<IconButtonSize, string> = {
  normal: 'w-5',
  small: 'w-5',
  medium: 'w-6',
};

export const SplitIconButton = forwardRef<HTMLButtonElement, SplitIconButtonProps>(
  function SplitIconButton(
    {
      size = 'small',
      selected = false,
      open = false,
      disabled = false,
      primaryLabel,
      secondaryLabel,
      primaryIcon,
      secondaryIcon,
      onPrimaryClick,
      onSecondaryClick,
      className,
    },
    ref
  ) {
    const disabledClasses = disabled ? 'opacity-40 pointer-events-none' : '';

    return (
      <div
        className={[
          'inline-flex items-center overflow-hidden rounded-sm bg-transparent',
          containerSizeClasses[size],
          disabledClasses,
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <button
          type="button"
          disabled={disabled}
          aria-label={primaryLabel}
          onClick={onPrimaryClick}
          className={[
            'flex items-center justify-center cursor-pointer rounded-l-sm',
            '[transition:transform_150ms_cubic-bezier(0.34,1.56,0.64,1),background-color_150ms_ease,opacity_150ms_ease]',
            'hover:scale-[1.04]',
            containerSizeClasses[size],
            primarySizeClasses[size],
            selected
              ? 'bg-primary text-primary-fg'
              : 'bg-transparent text-tertiary-fg hover:bg-surface-3',
          ].join(' ')}
        >
          {primaryIcon}
        </button>
        <button
          ref={ref as Ref<HTMLButtonElement>}
          type="button"
          disabled={disabled}
          aria-label={secondaryLabel}
          onClick={onSecondaryClick}
          className={[
            'flex items-center justify-center cursor-pointer rounded-r-sm',
            '[transition:transform_150ms_cubic-bezier(0.34,1.56,0.64,1),background-color_150ms_ease,opacity_150ms_ease,color_150ms_ease]',
            'hover:scale-[1.04]',
            containerSizeClasses[size],
            secondarySizeClasses[size],
            open
              ? 'bg-surface-3 text-text-2'
              : 'bg-transparent text-tertiary-fg hover:bg-surface-3',
          ].join(' ')}
        >
          {secondaryIcon}
        </button>
      </div>
    );
  }
);
