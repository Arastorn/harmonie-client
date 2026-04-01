import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

const ZOOM_LEVEL = 2;

interface DragState {
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
  moved: boolean;
}

export interface LightboxProps {
  src?: string;
  alt: string;
  headerLeft?: ReactNode;
  headerActions?: ReactNode;
  onClose: () => void;
  zoomInLabel?: string;
  zoomOutLabel?: string;
  closeLabel?: string;
}

export const Lightbox = ({
  src,
  alt,
  headerLeft,
  headerActions,
  onClose,
  zoomInLabel = 'Zoom in',
  zoomOutLabel = 'Zoom out',
  closeLabel = 'Close',
}: LightboxProps) => {
  const [zoomed, setZoomed] = useState(false);
  const [baseSize, setBaseSize] = useState<{ w: number; h: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const wasDragRef = useRef(false);

  useEffect(() => {
    setZoomed(false);
    setBaseSize(null);
  }, [src]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setZoomed(true);
      if (e.key === '-') setZoomed(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const maxW = window.innerWidth * 0.9;
    const maxH = window.innerHeight - 96;
    const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
    setBaseSize({ w: img.naturalWidth * scale, h: img.naturalHeight * scale });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed || !containerRef.current) return;
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop,
      moved: false,
    };
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current || !containerRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    containerRef.current.scrollLeft = dragRef.current.scrollLeft - dx;
    containerRef.current.scrollTop = dragRef.current.scrollTop - dy;
  };

  useEffect(() => {
    const handleDocMouseUp = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const moved = dragRef.current.moved;
      wasDragRef.current = moved;
      dragRef.current = null;
      setIsDragging(false);
      if (!moved && (e.target as HTMLElement).tagName !== 'IMG') {
        onClose();
      }
    };
    document.addEventListener('mouseup', handleDocMouseUp);
    return () => document.removeEventListener('mouseup', handleDocMouseUp);
  }, [onClose]);

  const zoom = zoomed ? ZOOM_LEVEL : 1;
  const imageStyle = baseSize
    ? { width: baseSize.w * zoom, height: baseSize.h * zoom }
    : { maxWidth: '90vw', maxHeight: 'calc(100vh - 96px)' };

  const actionButtonClass =
    'p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed';

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent z-10">
        <div>{headerLeft}</div>
        <div className="flex items-center gap-1">
          {headerActions}
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            className={actionButtonClass}
            aria-label={zoomed ? zoomOutLabel : zoomInLabel}
            title={zoomed ? zoomOutLabel : zoomInLabel}
          >
            {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={actionButtonClass}
            aria-label={closeLabel}
            title={closeLabel}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable image area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex"
        style={{ cursor: isDragging ? 'grabbing' : zoomed ? 'grab' : 'default' }}
        onClick={!zoomed ? onClose : undefined}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <div
          style={{ margin: 'auto', padding: '16px', flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {src ? (
            <img
              src={src}
              alt={alt}
              onLoad={handleImageLoad}
              draggable={false}
              onClick={() => {
                if (wasDragRef.current) {
                  wasDragRef.current = false;
                  return;
                }
                setZoomed((z) => !z);
              }}
              className="object-contain block rounded-sm select-none"
              style={{
                ...imageStyle,
                cursor: isDragging ? 'grabbing' : zoomed ? 'zoom-out' : 'zoom-in',
              }}
            />
          ) : (
            <div className="w-64 h-64 rounded-md bg-white/10 animate-pulse" />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
