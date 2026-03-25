import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { EmojiClickData } from 'emoji-picker-react';
import { EmojiPickerBase } from '@harmonie/ui';

const PICKER_WIDTH = 320;
const PICKER_HEIGHT = 380;
const OFFSET = 8;

interface MessageEmojiPickerProps {
  anchorRect: DOMRect;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export const MessageEmojiPicker = ({ anchorRect, onSelect, onClose }: MessageEmojiPickerProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  let top = anchorRect.bottom + OFFSET;
  if (top + PICKER_HEIGHT > window.innerHeight - OFFSET) {
    top = anchorRect.top - PICKER_HEIGHT - OFFSET;
  }
  const left = Math.max(OFFSET, anchorRect.right - PICKER_WIDTH);

  const handleEmojiClick = (data: EmojiClickData) => {
    onSelect(data.emoji);
    onClose();
  };

  return createPortal(
    <div ref={ref} className="fixed z-50 shadow-lg" style={{ top, left }}>
      <EmojiPickerBase
        onEmojiClick={handleEmojiClick}
        width={PICKER_WIDTH}
        height={PICKER_HEIGHT}
      />
    </div>,
    document.body
  );
};
