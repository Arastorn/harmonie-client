import { useEffect, useRef } from 'react';

export interface LongPressPoint {
  x: number;
  y: number;
}

const LONG_PRESS_DELAY_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

export const useLongPress = (onLongPress?: (position: LongPressPoint) => void) => {
  const timerRef = useRef<number | null>(null);
  const startPointRef = useRef<LongPressPoint | null>(null);
  const triggeredRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    },
    []
  );

  const cancel = () => {
    clearTimer();
    startPointRef.current = null;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (!onLongPress || event.pointerType === 'mouse' || !event.isPrimary) return;

    const point = { x: event.clientX, y: event.clientY };
    triggeredRef.current = false;
    startPointRef.current = point;
    clearTimer();

    timerRef.current = window.setTimeout(() => {
      triggeredRef.current = true;
      timerRef.current = null;
      onLongPress(point);
    }, LONG_PRESS_DELAY_MS);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const startPoint = startPointRef.current;
    if (!startPoint) return;

    const deltaX = event.clientX - startPoint.x;
    const deltaY = event.clientY - startPoint.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > LONG_PRESS_MOVE_TOLERANCE_PX) {
      cancel();
    }
  };

  const consumeTriggeredPress = (event: React.SyntheticEvent<HTMLElement>) => {
    if (!triggeredRef.current) return false;

    triggeredRef.current = false;
    event.preventDefault();
    event.stopPropagation();
    return true;
  };

  return {
    eventHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onLostPointerCapture: cancel,
    },
    consumeTriggeredPress,
  };
};
