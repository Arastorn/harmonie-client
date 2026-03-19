import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'className'
> {
  label?: string;
  error?: string;
  bottomRightElement?: ReactNode;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, disabled, id, bottomRightElement, ...props }, ref) => {
    const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const textareaClasses = [
      'w-full px-4 py-3 rounded-sm font-body text-sm text-text-1 bg-surface-2',
      'border border-border-2 outline-none resize-none',
      'transition-[border-color,box-shadow] duration-150',
      'placeholder:text-text-3',
      bottomRightElement ? 'pb-9 pr-10' : '',
      error
        ? 'border-error-fg shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-error-fg)_20%,transparent)]'
        : 'focus:border-secondary-fg focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-secondary-fg)_20%,transparent)]',
      disabled ? 'opacity-50 cursor-not-allowed' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className={[
              'font-body text-sm font-semibold',
              disabled ? 'text-text-2 opacity-50' : 'text-text-1',
            ].join(' ')}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            id={textareaId}
            ref={ref}
            disabled={disabled}
            className={textareaClasses}
            {...props}
          />
          {bottomRightElement && (
            <div className="absolute inset-y-0 right-3 z-10 flex items-start pt-2.5">
              {bottomRightElement}
            </div>
          )}
        </div>
        {error && <span className="font-body text-[11px] font-normal text-error-fg">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
