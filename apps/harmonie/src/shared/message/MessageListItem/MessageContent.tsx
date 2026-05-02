import { splitTextWithUrls } from '../utils/url';
import { isHtmlMessage, sanitizeMessageHtml } from '../utils/messageHtml';

interface MessageContentProps {
  content: string;
}

export const MessageContent = ({ content }: MessageContentProps) => {
  if (isHtmlMessage(content)) {
    const sanitized = sanitizeMessageHtml(content);

    return (
      <div
        className="message-rich-content w-full max-w-full min-w-0 text-sm text-text-2 wrap-break-word space-y-2 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:m-0 [&_blockquote]:border-l-2 [&_blockquote]:border-border-2 [&_blockquote]:pl-3 [&_blockquote]:italic [&_code]:rounded-sm [&_code]:bg-surface-3 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_ol]:my-0 [&_ol]:pl-5 [&_ol]:list-none [&_p]:m-0 [&_pre]:m-0 [&_pre]:max-w-full [&_pre]:overflow-x-hidden [&_pre]:whitespace-pre-wrap [&_pre]:wrap-break-word [&_pre]:rounded-md [&_pre]:bg-surface-3 [&_pre]:px-3 [&_pre]:py-2 [&_pre]:font-mono [&_pre]:text-xs [&_pre_code]:whitespace-pre-wrap [&_pre_code]:wrap-break-word [&_strong]:font-semibold [&_ul]:my-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol>li:not([data-list])]:list-decimal [&_ol>li:not([data-list])]:ml-1 [&_li[data-list='ordered']]:list-decimal [&_li[data-list='bullet']]:list-disc [&_li[data-list='ordered']]:ml-1 [&_li[data-list='bullet']]:ml-1"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  const parts = splitTextWithUrls(content);

  return (
    <p className="m-0 text-sm text-text-2 whitespace-pre-wrap wrap-break-word">
      {parts.map((part, index) =>
        part.type === 'url' ? (
          <a
            key={index}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary/80 break-all"
          >
            {part.value}
          </a>
        ) : (
          <span key={index}>{part.value}</span>
        )
      )}
    </p>
  );
};
