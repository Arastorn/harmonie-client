import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { EmojiPickerBase } from '../EmojiPickerBase/EmojiPickerBase';
import { EmojiAutocomplete } from '../EmojiTextarea/EmojiAutocomplete';
import { IconButton } from '../IconButton/IconButton';
import { Paperclip, SendHorizonal, Smile } from 'lucide-react';
import type { EmojiClickData, PickerProps } from 'emoji-picker-react';
import { useRichTextMessageInput } from './hooks/useRichTextMessageInput';
import { PICKER_HEIGHT, PICKER_WIDTH } from './utils/constants';
import { DEFAULT_LABELS } from './utils/toolbar.utils';
import type { RichTextMessageInputLabels } from './types';
import { RichTextToolbar } from './components/RichTextToolbar';
import { RichTextLinkBubble } from './components/RichTextLinkBubble';
import { RichTextLinkDialog } from './components/RichTextLinkDialog';

export interface RichTextMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  pickerProps?: Omit<PickerProps, 'onEmojiClick' | 'categoryIcons'>;
  showFormattingTools?: boolean;
  onToggleFormattingTools?: () => void;
  autoFocus?: boolean;
  autoFocusPlacement?: 'start' | 'end';
  onSubmit?: () => void;
  onEscape?: () => void;
  submitDisabled?: boolean;
  showSubmitButton?: boolean;
  onArrowUpWhenEmpty?: () => void;
  onPasteFiles?: (files: File[]) => void;
  onAttachClick?: () => void;
  labels?: Partial<RichTextMessageInputLabels>;
}

export const RichTextMessageInput = ({
  value,
  onChange,
  placeholder = '',
  disabled = false,
  error,
  pickerProps,
  showFormattingTools = false,
  onToggleFormattingTools,
  autoFocus = false,
  autoFocusPlacement = 'start',
  onSubmit,
  onEscape,
  submitDisabled = false,
  showSubmitButton = true,
  onArrowUpWhenEmpty,
  onPasteFiles,
  onAttachClick,
  labels,
}: RichTextMessageInputProps) => {
  const mergedLabels = useMemo(() => ({ ...DEFAULT_LABELS, ...(labels ?? {}) }), [labels]);
  const {
    activeFormats,
    autocompletePos,
    autocompleteRef,
    autocompleteResults,
    autocompleteSelectedIndex,
    closeLinkDialog,
    editorHostRef,
    emojiAnchorRect,
    emojiButtonRef,
    emojiPickerRef,
    handleEditorKeyDown,
    handleEditorMouseUp,
    handleEditorPasteCapture,
    handleInsertEmoji,
    handleSelectAutocomplete,
    linkBubble,
    linkDialogOpen,
    linkText,
    linkUrl,
    openLinkDialog,
    pickerStyle,
    quillRef,
    removeCurrentLink,
    setActiveFormats,
    setEmojiAnchorRect,
    setLinkText,
    setLinkUrl,
    setSelectedRange,
    showFloatingToolbar,
    submitLinkDialog,
    updateLinkBubble,
    wrapperRef,
  } = useRichTextMessageInput({
    value,
    onChange,
    placeholder,
    disabled,
    showFormattingTools,
    autoFocus,
    autoFocusPlacement,
    onSubmit,
    onEscape,
    onArrowUpWhenEmpty,
    onPasteFiles,
  });

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative rounded-sm border border-border-2 bg-surface-2 transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:shadow-[0_0_14px_var(--color-primary)]">
        {showFormattingTools && (
          <div className="px-3 pt-2">
            <div className="pb-1">
              <RichTextToolbar
                activeFormats={activeFormats}
                labels={mergedLabels}
                onOpenLinkDialog={openLinkDialog}
                quill={quillRef.current}
                setActiveFormats={setActiveFormats}
                setSelectedRange={setSelectedRange}
                updateLinkBubble={updateLinkBubble}
              />
            </div>
          </div>
        )}

        <div
          ref={wrapperRef}
          onKeyDownCapture={handleEditorKeyDown}
          onMouseUpCapture={handleEditorMouseUp}
          onPasteCapture={handleEditorPasteCapture}
          className={[
            'relative',
            '[&_.ql-container]:border-0 [&_.ql-container]:font-body',
            '[&_.ql-editor]:min-h-[44px] [&_.ql-editor]:w-full [&_.ql-editor]:max-h-[50vh] [&_.ql-editor]:overflow-y-auto [&_.ql-editor]:px-4 [&_.ql-editor]:pb-3 [&_.ql-editor]:text-sm [&_.ql-editor]:text-text-2 [&_.ql-editor]:caret-primary [&_.ql-editor]:outline-none',
            showFormattingTools ? '[&_.ql-editor]:pt-1' : '[&_.ql-editor]:pt-3',
            '[&_.ql-editor]:whitespace-pre-wrap [&_.ql-editor]:break-words',
            '[&_.ql-editor.ql-blank::before]:!text-text-3',
            '[&_.ql-editor_h1]:text-lg [&_.ql-editor_h1]:font-semibold [&_.ql-editor_h1]:leading-snug',
            '[&_.ql-editor_h2]:text-base [&_.ql-editor_h2]:font-semibold [&_.ql-editor_h2]:leading-snug',
            '[&_.ql-editor_h3]:text-sm [&_.ql-editor_h3]:font-semibold [&_.ql-editor_h3]:leading-snug',
            '[&_.ql-editor_a]:text-primary [&_.ql-editor_a]:underline [&_.ql-editor_a]:underline-offset-2 [&_.ql-editor_a]:break-all',
            '[&_.ql-editor_blockquote]:border-l-2 [&_.ql-editor_blockquote]:border-border-2 [&_.ql-editor_blockquote]:pl-3 [&_.ql-editor_blockquote]:italic',
            '[&_.ql-editor_ol]:pl-5 [&_.ql-editor_li]:pl-4 [&_.ql-editor_li]:leading-normal [&_.ql-editor_li>.ql-ui]:w-0',
            '[&_.ql-editor_li>.ql-ui::before]:-ml-4 [&_.ql-editor_li>.ql-ui::before]:mr-2 [&_.ql-editor_li>.ql-ui::before]:w-2.5 [&_.ql-editor_li>.ql-ui::before]:text-center',
            "[&_.ql-editor_li[data-list='bullet']>.ql-ui::before]:text-[1.35em] [&_.ql-editor_li[data-list='bullet']>.ql-ui::before]:leading-[0]",
            '[&_.ql-editor_pre]:overflow-x-auto [&_.ql-editor_pre]:rounded-md [&_.ql-editor_pre]:bg-surface-3 [&_.ql-editor_pre]:px-3 [&_.ql-editor_pre]:py-2 [&_.ql-editor_pre]:font-mono [&_.ql-editor_pre]:text-xs',
            '[&_.ql-editor_.ql-code-block-container]:overflow-x-auto [&_.ql-editor_.ql-code-block-container]:rounded-md [&_.ql-editor_.ql-code-block-container]:bg-surface-3 [&_.ql-editor_.ql-code-block-container]:px-3 [&_.ql-editor_.ql-code-block-container]:py-2 [&_.ql-editor_.ql-code-block-container]:font-mono [&_.ql-editor_.ql-code-block-container]:text-xs',
            '[&_.ql-editor_.ql-code-block]:whitespace-pre-wrap',
            '[&_.ql-editor_code]:rounded-sm [&_.ql-editor_code]:bg-surface-3 [&_.ql-editor_code]:px-1.5 [&_.ql-editor_code]:py-0.5 [&_.ql-editor_code]:font-mono',
            disabled
              ? 'opacity-50 [&_.ql-editor]:cursor-not-allowed'
              : '[&_.ql-editor]:cursor-text',
          ].join(' ')}
        >
          {showFloatingToolbar && (
            <div className="absolute -top-12 left-3 z-20 opacity-100 translate-y-0">
              <div className="rounded-full border border-border-2 bg-surface-1 p-0.5 shadow-lg">
                <RichTextToolbar
                  activeFormats={activeFormats}
                  labels={mergedLabels}
                  onOpenLinkDialog={openLinkDialog}
                  quill={quillRef.current}
                  setActiveFormats={setActiveFormats}
                  setSelectedRange={setSelectedRange}
                  updateLinkBubble={updateLinkBubble}
                />
              </div>
            </div>
          )}
          {!showFloatingToolbar && linkBubble && (
            <RichTextLinkBubble
              editLabel={mergedLabels.editLink}
              removeLabel={mergedLabels.removeLink}
              url={linkBubble.url}
              top={linkBubble.top}
              left={linkBubble.left}
              onEdit={() => {
                const quill = quillRef.current;
                if (!quill) return;
                openLinkDialog(quill);
              }}
              onRemove={removeCurrentLink}
            />
          )}
          <div ref={editorHostRef} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border-2 px-3 py-1.5 text-text-3">
          <div className="flex items-center gap-1">
            <IconButton
              type="button"
              size="small"
              variant="ghost"
              selected={showFormattingTools}
              className="h-8 min-w-8 rounded-md px-2 text-[12px] font-semibold"
              onClick={onToggleFormattingTools}
              aria-label={mergedLabels.toggleFormatting}
              title={mergedLabels.toggleFormatting}
            >
              <span>Aa</span>
            </IconButton>
            {onAttachClick && (
              <IconButton
                type="button"
                onClick={onAttachClick}
                disabled={disabled}
                size="small"
                variant="ghost"
                aria-label={mergedLabels.attachFile}
                title={mergedLabels.attachFile}
              >
                <Paperclip size={16} />
              </IconButton>
            )}
            <IconButton
              ref={emojiButtonRef}
              type="button"
              disabled={disabled}
              size="small"
              variant="ghost"
              aria-label={mergedLabels.openEmoji}
              title={mergedLabels.openEmoji}
              onClick={() => {
                const rect = emojiButtonRef.current?.getBoundingClientRect();
                if (rect) setEmojiAnchorRect((current) => (current ? null : rect));
              }}
            >
              <Smile size={16} />
            </IconButton>
          </div>
          {showSubmitButton && onSubmit && (
            <IconButton
              type="button"
              variant="primary"
              size="normal"
              onClick={onSubmit}
              disabled={disabled || submitDisabled}
              aria-label={mergedLabels.send}
              title={mergedLabels.send}
            >
              <SendHorizonal size={16} />
            </IconButton>
          )}
        </div>
      </div>

      {error && <span className="font-body text-[11px] font-normal text-error-fg">{error}</span>}

      {emojiAnchorRect &&
        pickerStyle &&
        createPortal(
          <div ref={emojiPickerRef} className="fixed z-50 shadow-lg" style={pickerStyle}>
            <EmojiPickerBase
              onEmojiClick={(data: EmojiClickData) => handleInsertEmoji(data.emoji)}
              searchPlaceholder={mergedLabels.emojiSearchPlaceholder}
              width={PICKER_WIDTH}
              height={PICKER_HEIGHT}
              {...(pickerProps ?? {})}
            />
          </div>,
          document.body
        )}

      {linkDialogOpen && (
        <RichTextLinkDialog
          cancelLabel={mergedLabels.cancel}
          closeLabel={mergedLabels.cancel}
          linkText={linkText}
          linkTextLabel={mergedLabels.linkTextLabel}
          linkUrl={linkUrl}
          linkUrlLabel={mergedLabels.linkUrlLabel}
          onClose={closeLinkDialog}
          onRemove={removeCurrentLink}
          onSave={submitLinkDialog}
          removeLabel={mergedLabels.removeLink}
          saveLabel={mergedLabels.save}
          setLinkText={setLinkText}
          setLinkUrl={setLinkUrl}
          title={mergedLabels.linkDialogTitle}
        />
      )}

      {autocompleteResults.length > 0 && autocompletePos && (
        <EmojiAutocomplete
          results={autocompleteResults}
          selectedIndex={autocompleteSelectedIndex}
          pos={autocompletePos}
          onSelect={handleSelectAutocomplete}
          containerRef={autocompleteRef}
        />
      )}
    </div>
  );
};
