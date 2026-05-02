import Quill from 'quill';
import type { QuillRange } from '../types';

const URL_PATTERN = /^(https?:\/\/|mailto:|tel:)[^\s]+$/i;

export const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const isDirectUrl = (value: string) => URL_PATTERN.test(value.trim());

export const getExpandedLinkRange = (
  quill: Quill,
  range: Exclude<QuillRange, null>,
  linkUrl: string
) => {
  if (range.length > 0) return range;

  let start = range.index;
  let end = range.index;
  const docLength = Math.max(quill.getLength() - 1, 0);

  while (start > 0 && quill.getFormat(start - 1, 1).link === linkUrl) {
    start -= 1;
  }

  while (end < docLength && quill.getFormat(end, 1).link === linkUrl) {
    end += 1;
  }

  return { index: start, length: end - start };
};
