export interface SeparatorProps {
  label?: string;
  variant?: 'default' | 'accent';
}

export const Separator = ({ label, variant = 'default' }: SeparatorProps) => {
  const isAccent = variant === 'accent';

  if (!label) {
    return <div className={`h-px w-full ${isAccent ? 'bg-primary' : 'bg-border-2'}`} />;
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 h-px ${isAccent ? 'bg-primary' : 'bg-border-2'}`} />
      <span
        className={`font-body text-xs font-semibold ${isAccent ? 'text-primary' : 'text-text-3'}`}
      >
        {label}
      </span>
      <div className={`flex-1 h-px ${isAccent ? 'bg-primary' : 'bg-border-2'}`} />
    </div>
  );
};
