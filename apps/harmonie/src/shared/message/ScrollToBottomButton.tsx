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
    className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 shadow-lg border border-border-2 bg-surface-3 text-text-1"
  >
    <ArrowDown size={16} />
  </IconButton>
);
