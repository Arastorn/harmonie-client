import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Smile } from 'lucide-react';
import type { EmojiClickData, PickerProps } from 'emoji-picker-react';
import { Textarea, type TextareaProps } from '../Textarea/Textarea';
import { EmojiPickerBase } from '../EmojiPickerBase/EmojiPickerBase';

export interface EmojiTextareaProps extends Omit<
  TextareaProps,
  'value' | 'onChange' | 'bottomRightElement' | 'ref'
> {
  value: string;
  onChange: (value: string) => void;
  pickerProps?: Omit<PickerProps, 'onEmojiClick' | 'categoryIcons'>;
  emojiButtonLabel?: string;
}

const PICKER_W = 320;
const PICKER_H = 380;
const OFFSET = 8;

export const EmojiTextarea = ({
  value,
  onChange,
  pickerProps,
  emojiButtonLabel = 'Open emoji picker',
  ...textareaProps
}: EmojiTextareaProps) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPickerOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !pickerRef.current?.contains(target)) {
        setIsPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isPickerOpen]);

  const openPicker = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    // Prefer opening downward; fall back to upward if not enough room
    const topDownward = rect.bottom + OFFSET;
    const top =
      topDownward + PICKER_H <= window.innerHeight - OFFSET
        ? topDownward
        : rect.top - PICKER_H - OFFSET;

    // Align right edge with button, clamped to viewport
    const left = Math.max(OFFSET, rect.right - PICKER_W);

    setPickerPos({ top, left });
    setIsPickerOpen(true);
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(`${value}${emoji}`);
      setIsPickerOpen(false);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    onChange(`${value.slice(0, start)}${emoji}${value.slice(end)}`);
    setIsPickerOpen(false);

    requestAnimationFrame(() => {
      textarea.focus();
      const nextCursorPosition = start + emoji.length;
      textarea.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    insertEmoji(emojiData.emoji);
  };

  const emojiButton = (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (isPickerOpen ? setIsPickerOpen(false) : openPicker())}
        className="flex h-6 w-6 items-center justify-center cursor-pointer rounded text-text-3 transition-colors hover:text-text-1"
        aria-label={emojiButtonLabel}
      >
        <Smile size={16} />
      </button>
      {isPickerOpen &&
        createPortal(
          <div
            ref={pickerRef}
            className="fixed z-50 shadow-lg"
            style={{ top: pickerPos.top, left: pickerPos.left }}
          >
            <EmojiPickerBase
              onEmojiClick={handleEmojiClick}
              width={PICKER_W}
              height={PICKER_H}
              {...(pickerProps ?? {})}
            />
          </div>,
          document.body
        )}
    </>
  );

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      bottomRightElement={emojiButton}
      {...textareaProps}
    />
  );
};
