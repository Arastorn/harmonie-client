export const replaceTextRange = (
  value: string,
  start: number,
  length: number,
  replacement: string
) => value.slice(0, start) + replacement + value.slice(start + length);

export const insertTextAtSelection = (value: string, start: number, end: number, text: string) =>
  value.slice(0, start) + text + value.slice(end);

export const restoreTextareaSelection = (
  textarea: HTMLTextAreaElement | null,
  cursorPosition: number,
  shouldFocus = false
) => {
  requestAnimationFrame(() => {
    if (!textarea) return;
    if (shouldFocus) textarea.focus();
    textarea.setSelectionRange(cursorPosition, cursorPosition);
  });
};
