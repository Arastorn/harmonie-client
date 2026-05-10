export const preventAppZoom = () => {
  if (typeof window === 'undefined') return;
  if (!window.matchMedia('(hover: none), (pointer: coarse), (max-width: 767px)').matches) return;

  let lastTouchEnd = 0;

  const preventGesture = (event: Event) => {
    event.preventDefault();
  };

  const preventMultiTouch = (event: TouchEvent) => {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  };

  const preventDoubleTapZoom = (event: TouchEvent) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  };

  document.addEventListener('gesturestart', preventGesture, { passive: false });
  document.addEventListener('gesturechange', preventGesture, { passive: false });
  document.addEventListener('gestureend', preventGesture, { passive: false });
  document.addEventListener('touchmove', preventMultiTouch, { passive: false });
  document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });
};
