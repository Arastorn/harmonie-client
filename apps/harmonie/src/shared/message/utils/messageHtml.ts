import DOMPurify from 'dompurify';

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

const MESSAGE_HTML_ALLOWED_TAGS = [
  'a',
  'blockquote',
  'br',
  'code',
  'em',
  'h1',
  'h2',
  'h3',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'u',
  'ul',
  's',
];

const MESSAGE_HTML_ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'class',
  'contenteditable',
  'data-list',
];

export const isHtmlMessage = (content: string) => HTML_TAG_PATTERN.test(content);

const decodeHtmlEntities = (content: string) => {
  if (!content.includes('&') || typeof document === 'undefined') return content;

  const textarea = document.createElement('textarea');
  textarea.innerHTML = content;
  return textarea.value;
};

export const stripHtmlToText = (content: string) =>
  decodeHtmlEntities(
    content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
  ).trim();

const isUnformattedRichTextHtml = (content: string) => {
  if (!isHtmlMessage(content) || typeof document === 'undefined') return false;

  const template = document.createElement('template');
  template.innerHTML = content.trim();
  const elements = Array.from(template.content.querySelectorAll('*'));

  return elements.every(
    (element) =>
      ['BR', 'P'].includes(element.tagName) &&
      (element.tagName === 'BR' || element.attributes.length === 0)
  );
};

export const getMessagePayloadContent = (content: string) =>
  isUnformattedRichTextHtml(content) ? stripHtmlToText(content) : content;

const removeTrailingEmptyBlocks = (content: string) =>
  content
    .replace(/(?:<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>\s*)+$/gi, '')
    .replace(/(?:<blockquote>(?:\s|&nbsp;|<br\s*\/?>)*<\/blockquote>\s*)+$/gi, '')
    .trim();

export const sanitizeMessageHtml = (content: string) =>
  removeTrailingEmptyBlocks(
    DOMPurify.sanitize(content, {
      ALLOWED_TAGS: MESSAGE_HTML_ALLOWED_TAGS,
      ALLOWED_ATTR: MESSAGE_HTML_ALLOWED_ATTR,
    })
  );
