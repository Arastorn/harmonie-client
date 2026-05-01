import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Smile } from 'lucide-react';
import type { EmojiClickData, PickerProps } from 'emoji-picker-react';
import { Textarea, type TextareaProps } from '../Textarea/Textarea';
import { EmojiPickerBase } from '../EmojiPickerBase/EmojiPickerBase';
import { EmojiAutocomplete } from './EmojiAutocomplete';
import { useEmojiAutocomplete } from './useEmojiAutocomplete';
import { useEmojiPicker } from './useEmojiPicker';

export interface EmojiTextareaProps extends Omit<
  TextareaProps,
  'value' | 'onChange' | 'bottomRightElement' | 'bottomRightElementWide' | 'ref' | 'topContent'
> {
  value: string;
  onChange: (value: string) => void;
  pickerProps?: Omit<PickerProps, 'onEmojiClick' | 'categoryIcons'>;
  emojiButtonLabel?: string;
  extraActions?: ReactNode;
  topContent?: ReactNode;
}

export const EmojiTextarea = ({
  value,
  onChange,
  onKeyDown: parentOnKeyDown,
  pickerProps,
  emojiButtonLabel = 'Open emoji picker',
  extraActions,
  topContent,
  ...textareaProps
}: EmojiTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { autocomplete, autocompleteRef, handleChange, handleKeyDown, selectAutocomplete } =
    useEmojiAutocomplete({
      value,
      onChange,
      textareaRef,
      parentOnKeyDown,
    });
  const { pickerOpen, pickerPos, buttonRef, pickerRef, togglePicker, insertEmoji } = useEmojiPicker(
    {
      value,
      onChange,
      textareaRef,
    }
  );

  const emojiButton = (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={togglePicker}
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-text-3 transition-colors hover:text-text-1"
        aria-label={emojiButtonLabel}
      >
        <Smile size={16} />
      </button>
      {pickerOpen &&
        createPortal(
          <div ref={pickerRef} className="fixed z-50 shadow-lg" style={pickerPos}>
            <EmojiPickerBase
              onEmojiClick={(d: EmojiClickData) => insertEmoji(d.emoji)}
              width={320}
              height={380}
              {...(pickerProps ?? {})}
            />
          </div>,
          document.body
        )}
    </>
  );

  return (
    <>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        bottomRightElement={
          extraActions ? (
            <div className="flex items-center gap-1">
              {extraActions}
              {emojiButton}
            </div>
          ) : (
            emojiButton
          )
        }
        bottomRightElementWide={!!extraActions}
        topContent={topContent}
        {...textareaProps}
      />
      {autocomplete && (
        <EmojiAutocomplete
          results={autocomplete.results}
          selectedIndex={autocomplete.selectedIndex}
          pos={autocomplete.pos}
          onSelect={selectAutocomplete}
          containerRef={autocompleteRef}
        />
      )}
    </>
  );
};
