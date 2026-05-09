import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

export type InputSize = 'default' | 'sm';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: ReactNode;
  uiSize?: InputSize;
  wrapperClassName?: string;
}

const sizeClasses: Record<InputSize, string> = {
  default: 'px-4 py-3 text-sm rounded-sm',
  sm: 'px-2 py-1 text-sm rounded-sm',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      disabled,
      id,
      rightElement,
      uiSize = 'default',
      className,
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const inputClasses = [
      'w-full font-body text-text-2 caret-primary bg-surface-2',
      'border border-border-2 outline-none',
      'transition-[border-color,box-shadow] duration-150',
      sizeClasses[uiSize],
      rightElement ? 'pr-10' : '',
      error
        ? 'border-error-fg shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-error-fg)_14%,transparent)]'
        : 'focus:border-secondary-fg focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-secondary-fg)_14%,transparent)]',
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={['flex flex-col gap-1.5', wrapperClassName ?? ''].filter(Boolean).join(' ')}>
        {label && (
          <label
            htmlFor={inputId}
            className={[
              'font-body text-sm font-semibold',
              disabled ? 'text-text-2 opacity-50' : 'text-text-1',
            ].join(' ')}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input id={inputId} ref={ref} disabled={disabled} className={inputClasses} {...props} />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-3">
              {rightElement}
            </div>
          )}
        </div>
        {error && <span className="font-body text-[11px] font-normal text-error-fg">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
