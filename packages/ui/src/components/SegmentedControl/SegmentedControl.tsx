export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) => {
  return (
    <div role="group" className="flex gap-1 bg-surface-2 p-1 rounded-sm">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={[
            'flex-1 py-1.5 text-sm font-body rounded-sm transition-colors cursor-pointer',
            value === option.value
              ? 'bg-surface-1 text-text-1 font-semibold shadow-sm'
              : 'text-text-3 hover:text-text-2',
          ].join(' ')}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
