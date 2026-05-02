export const scheduleCenterMessageIfOutsideView = (
  scrollElement: HTMLElement,
  messageElement: HTMLElement,
  behavior: ScrollBehavior = 'auto'
) => {
  const centerIfNeeded = () => {
    const scrollRect = scrollElement.getBoundingClientRect();
    const messageRect = messageElement.getBoundingClientRect();
    const comfortableMargin = Math.min(scrollElement.clientHeight * 0.2, 120);
    const isComfortablyVisible =
      messageRect.top >= scrollRect.top + comfortableMargin &&
      messageRect.bottom <= scrollRect.bottom - comfortableMargin;

    if (isComfortablyVisible) return;

    const centeredOffset = (scrollElement.clientHeight - messageElement.offsetHeight) / 2;
    const top = scrollElement.scrollTop + messageRect.top - scrollRect.top - centeredOffset;

    scrollElement.scrollTo({ top: Math.max(top, 0), behavior });
  };

  const frameIds: number[] = [];
  const timeoutId = window.setTimeout(centerIfNeeded, 80);

  frameIds.push(
    requestAnimationFrame(() => {
      centerIfNeeded();
      frameIds.push(requestAnimationFrame(centerIfNeeded));
    })
  );

  return () => {
    frameIds.forEach(cancelAnimationFrame);
    window.clearTimeout(timeoutId);
  };
};
