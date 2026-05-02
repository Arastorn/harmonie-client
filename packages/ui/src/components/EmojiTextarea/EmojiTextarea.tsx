import { useRef, type ChangeEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Smile } from 'lucide-react';
import type { EmojiClickData, PickerProps } from 'emoji-picker-react';
import { Textarea, type TextareaProps } from '../Textarea/Textarea';
import { EmojiPickerBase } from '../EmojiPickerBase/EmojiPickerBase';
import { useEmojiPicker } from './useEmojiPicker';

export interface PlainEmojiTextareaProps extends Omit<
  TextareaProps,
  'value' | 'onChange' | 'bottomRightElement' | 'bottomRightElementWide' | 'ref' | 'topContent'
> {
  value: string;
  onChange: (value: string) => void;
  textareaRef?: RefObject<HTMLTextAreaElement>;
  pickerProps?: Omit<PickerProps, 'onEmojiClick' | 'categoryIcons'>;
  emojiButtonLabel?: string;
  emojiButtonClassName?: string;
  controlsPlacement?: 'inside' | 'below';
  extraActions?: ReactNode;
  topContent?: ReactNode;
}

export const PlainEmojiTextarea = ({
  value,
  onChange,
  onKeyDown,
  textareaRef: forwardedTextareaRef,
  pickerProps,
  emojiButtonLabel = 'Open emoji picker',
  emojiButtonClassName,
  controlsPlacement = 'inside',
  extraActions,
  topContent,
  ...textareaProps
}: PlainEmojiTextareaProps) => {
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = forwardedTextareaRef ?? internalTextareaRef;
  const { pickerOpen, pickerPos, buttonRef, pickerRef, togglePicker, insertEmoji } = useEmojiPicker(
    {
      value,
      onChange,
      textareaRef,
    }
  );

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  const emojiButton = (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={togglePicker}
        className={[
          'flex h-6 w-6 cursor-pointer items-center justify-center rounded text-text-3 transition-colors hover:text-text-1',
          emojiButtonClassName ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={emojiButtonLabel}
      >
        <Smile size={16} />
      </button>
      {pickerOpen &&
        createPortal(
          <div ref={pickerRef} className="fixed z-50 shadow-lg" style={pickerPos}>
            <EmojiPickerBase
              onEmojiClick={(data: EmojiClickData) => insertEmoji(data.emoji)}
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
        onKeyDown={onKeyDown}
        bottomRightElement={
          controlsPlacement === 'inside' ? (
            extraActions ? (
              <div className="flex items-center gap-1">
                {extraActions}
                {emojiButton}
              </div>
            ) : (
              emojiButton
            )
          ) : undefined
        }
        bottomRightElementWide={controlsPlacement === 'inside' && !!extraActions}
        topContent={topContent}
        {...textareaProps}
      />
      {controlsPlacement === 'below' && (
        <div className="mt-2 flex items-center gap-1 text-text-3">
          {extraActions}
          {emojiButton}
        </div>
      )}
    </>
  );
};
