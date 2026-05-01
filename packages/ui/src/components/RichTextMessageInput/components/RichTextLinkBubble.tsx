interface RichTextLinkBubbleProps {
  editLabel: string;
  removeLabel: string;
  url: string;
  top: number;
  left: number;
  onEdit: () => void;
  onRemove: () => void;
}

export const RichTextLinkBubble = ({
  editLabel,
  removeLabel,
  url,
  top,
  left,
  onEdit,
  onRemove,
}: RichTextLinkBubbleProps) => (
  <div
    className="absolute z-20"
    style={{ top, left: Math.max(left, 12), transform: 'translateX(-50%)' }}
  >
    <div className="flex items-center gap-2 rounded-md border border-border-2 bg-surface-1 px-2 py-1 shadow-lg">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="max-w-48 truncate text-xs text-primary underline underline-offset-2"
      >
        {url}
      </a>
      <button
        type="button"
        className="cursor-pointer text-xs font-medium text-text-2 hover:text-text-1"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onEdit}
      >
        {editLabel}
      </button>
      <button
        type="button"
        className="cursor-pointer text-xs font-medium text-error-fg hover:opacity-80"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onRemove}
      >
        {removeLabel}
      </button>
    </div>
  </div>
);
