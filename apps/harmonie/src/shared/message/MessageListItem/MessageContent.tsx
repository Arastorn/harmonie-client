import { splitTextWithUrls } from '../utils/url';

interface MessageContentProps {
  content: string;
}

export const MessageContent = ({ content }: MessageContentProps) => {
  const parts = splitTextWithUrls(content);

  return (
    <p className="text-sm text-text-2 whitespace-pre-wrap wrap-break-word">
      {parts.map((part, i) =>
        part.type === 'url' ? (
          <a
            key={i}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary/80 break-all"
          >
            {part.value}
          </a>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </p>
  );
};
