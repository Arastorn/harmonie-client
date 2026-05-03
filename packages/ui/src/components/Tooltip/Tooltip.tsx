import { CSSProperties, ReactElement, ReactNode, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  side?: TooltipSide;
  id?: string;
  className?: string;
  delay?: number;
}

const offset = 10;
const viewportMargin = 8;
const maxWidth = 224;

const transformClasses: Record<TooltipSide, string> = {
  top: '-translate-x-1/2 -translate-y-full',
  right: '-translate-y-1/2',
  bottom: '-translate-x-1/2',
  left: '-translate-x-full -translate-y-1/2',
};

const getPosition = (rect: DOMRect, side: TooltipSide): CSSProperties => {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const minCenterX = viewportMargin + maxWidth / 2;
  const maxCenterX = Math.max(minCenterX, window.innerWidth - viewportMargin - maxWidth / 2);

  if (side === 'top' || side === 'bottom') {
    return {
      left: Math.min(Math.max(centerX, minCenterX), maxCenterX),
      top: side === 'top' ? rect.top - offset : rect.bottom + offset,
    };
  }

  return {
    left:
      side === 'right'
        ? Math.min(rect.right + offset, window.innerWidth - viewportMargin - maxWidth)
        : Math.max(rect.left - offset, viewportMargin + maxWidth),
    top: Math.min(Math.max(centerY, viewportMargin), window.innerHeight - viewportMargin),
  };
};

export const Tooltip = ({
  content,
  children,
  side = 'top',
  id,
  className,
  delay = 450,
}: TooltipProps) => {
  const generatedId = useId();
  const tooltipId = id ?? generatedId;
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const [position, setPosition] = useState<CSSProperties | null>(null);

  const close = () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setPosition(null);
  };

  const open = () => {
    close();
    timeoutRef.current = window.setTimeout(() => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (rect) setPosition(getPosition(rect, side));
    }, delay);
  };

  useEffect(() => close, []);

  if (!content) return children;

  return (
    <span
      ref={wrapperRef}
      className={['inline-flex', className ?? ''].join(' ')}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
    >
      {children}
      {position &&
        createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            className={[
              'pointer-events-none fixed z-[9999] w-max max-w-56 rounded-sm border border-border-2 bg-text-1 px-2.5 py-1.5 text-xs font-medium leading-snug text-surface-1 shadow-lg',
              transformClasses[side],
            ].join(' ')}
            style={position}
          >
            {content}
          </span>,
          document.body
        )}
    </span>
  );
};
