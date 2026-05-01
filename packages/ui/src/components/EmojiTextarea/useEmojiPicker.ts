import { useEffect, useRef, useState, type RefObject } from 'react';
import { insertTextAtSelection, restoreTextareaSelection } from './emojiInsertion';

const PICKER_W = 320;
const PICKER_H = 380;
const OFFSET = 8;

interface UseEmojiPickerParams {
  value: string;
  onChange: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export const useEmojiPicker = ({ value, onChange, textareaRef }: UseEmojiPickerParams) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !pickerRef.current?.contains(target)) {
        setPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [pickerOpen]);

  const openPicker = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const topDown = rect.bottom + OFFSET;
    const top =
      topDown + PICKER_H <= window.innerHeight - OFFSET ? topDown : rect.top - PICKER_H - OFFSET;

    setPickerPos({ top, left: Math.max(OFFSET, rect.right - PICKER_W) });
    setPickerOpen(true);
  };

  const togglePicker = () => {
    if (pickerOpen) {
      setPickerOpen(false);
      return;
    }
    openPicker();
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    onChange(insertTextAtSelection(value, start, end, emoji));
    setPickerOpen(false);
    restoreTextareaSelection(textarea, start + emoji.length, true);
  };

  return {
    pickerOpen,
    pickerPos,
    buttonRef,
    pickerRef,
    togglePicker,
    insertEmoji,
  };
};
