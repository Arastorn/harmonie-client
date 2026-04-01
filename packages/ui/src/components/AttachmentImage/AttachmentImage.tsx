import { type ReactNode } from 'react';

export interface AttachmentImageProps {
  src?: string;
  alt: string;
  onOpen?: () => void;
  openLabel?: string;
  topRightAction?: ReactNode;
}

export const AttachmentImage = ({
  src,
  alt,
  onOpen,
  openLabel = 'Open image',
  topRightAction,
}: AttachmentImageProps) => {
  if (!src) {
    return <div className="w-48 h-32 rounded-md bg-surface-3 animate-pulse shrink-0" />;
  }

  return (
    <div className="relative shrink-0 group/img">
      <button
        type="button"
        onClick={onOpen}
        className="rounded-md overflow-hidden border border-border-2 hover:opacity-90 transition-opacity cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary block"
        aria-label={openLabel}
      >
        <img src={src} alt={alt} className="max-w-64 max-h-48 object-cover block" />
      </button>
      {topRightAction && (
        <div className="absolute top-1 right-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
          {topRightAction}
        </div>
      )}
    </div>
  );
};
