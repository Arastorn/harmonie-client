import { ArrowDown } from 'lucide-react';
import { IconButton } from '@harmonie/ui';

interface ScrollToBottomButtonProps {
  label: string;
  onClick: () => void;
}

export const ScrollToBottomButton = ({ label, onClick }: ScrollToBottomButtonProps) => (
  <IconButton
    type="button"
    size="normal"
    variant="filled"
    aria-label={label}
    title={label}
    onClick={onClick}
    className="absolute right-4 bottom-4 z-10 border border-border-2 bg-surface-3 text-text-1 shadow-lg md:left-1/2 md:right-auto md:-translate-x-1/2"
  >
    <ArrowDown size={16} />
  </IconButton>
);
