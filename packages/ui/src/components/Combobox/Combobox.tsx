import type { ReactNode } from 'react';
import { Input } from '../Input/Input';

export interface ComboboxItem {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
}

export interface ComboboxProps {
  items: ComboboxItem[];
  onSelect: (value: string) => void;
  header?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: ReactNode;
  className?: string;
  autoFocusSearch?: boolean;
  align?: 'left' | 'right';
  placement?: 'bottom' | 'top';
}

export const Combobox = ({
  items,
  onSelect,
  header,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  emptyMessage,
  className = '',
  autoFocusSearch = false,
  align = 'left',
  placement = 'bottom',
}: ComboboxProps) => {
  const panelClasses = [
    'absolute z-50 overflow-hidden rounded-sm border border-border-2 bg-surface-1 shadow-lg',
    placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
    align === 'right' ? 'right-0' : 'left-0',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={panelClasses}>
      {header && (
        <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-text-3 uppercase tracking-wide">
          {header}
        </div>
      )}

      {onSearchChange && (
        <div className="px-2 pt-2 shrink-0">
          <Input
            autoFocus={autoFocusSearch}
            value={searchValue ?? ''}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            uiSize="sm"
            wrapperClassName="gap-0"
          />
        </div>
      )}

      <div className="overflow-y-auto px-1 pb-1">
        {items.length === 0 ? (
          <p className="px-3 py-2 text-xs text-text-3">{emptyMessage}</p>
        ) : (
          items.map((item) => (
            <button
              key={item.value}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(item.value)}
              className={[
                'flex w-full items-center gap-2 text-left transition-colors cursor-pointer rounded-sm',
                'font-body font-medium text-text-2 hover:bg-surface-2 hover:text-text-1',
                item.description ? 'px-3 py-2' : 'px-3 py-1.5',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {item.icon && <span className="shrink-0 text-text-3">{item.icon}</span>}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-text-1">{item.label}</span>
                {item.description && (
                  <span className="block text-xs text-text-3">{item.description}</span>
                )}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
