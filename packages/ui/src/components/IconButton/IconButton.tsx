import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';

export type IconButtonSize = 'normal' | 'small' | 'medium';
export type IconButtonVariant = 'ghost' | 'filled' | 'overlay' | 'primary' | 'danger';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  selected?: boolean;
  children: ReactNode;
}

const sizeClasses: Record<IconButtonSize, string> = {
  normal: 'w-[36px] h-[36px] rounded-full',
  small: 'w-[28px] h-[28px] rounded-full',
  medium: 'w-[40px] h-[40px] rounded-full',
};

const variantClasses: Record<IconButtonVariant, string> = {
  ghost: 'bg-transparent text-tertiary-fg hover:bg-surface-3',
  filled: 'bg-surface-3 text-text-2 hover:bg-surface-2',
  overlay: 'bg-transparent text-primary-fg hover:bg-transparent',
  primary: 'bg-primary text-primary-fg hover:opacity-90',
  danger: 'bg-error text-error-fg hover:opacity-90',
};

const selectedClasses = 'bg-primary text-primary-fg hover:bg-primary';

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { size = 'normal', variant = 'ghost', selected = false, disabled, children, className, ...props },
  ref
) {
  const classes = [
    'inline-flex items-center justify-center',
    '[transition:transform_150ms_cubic-bezier(0.34,1.56,0.64,1),background-color_150ms_ease,opacity_150ms_ease]',
    'hover:scale-[1.04]',
    sizeClasses[size],
    selected ? selectedClasses : variantClasses[variant],
    disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button ref={ref} disabled={disabled} className={classes} {...props}>
      {children}
    </button>
  );
});
