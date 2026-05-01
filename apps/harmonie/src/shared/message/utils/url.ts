const URL_PATTERN = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;

type TextPart = { type: 'text'; value: string };
type UrlPart = { type: 'url'; value: string };
export type MessagePart = TextPart | UrlPart;

export const splitTextWithUrls = (text: string): MessagePart[] => {
  const parts: MessagePart[] = [];
  const regex = new RegExp(URL_PATTERN.source, 'g');
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'url', value: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
};
