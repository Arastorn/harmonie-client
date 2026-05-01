import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import {
  getAutocompleteResults,
  getPartialMatchLength,
  resolveReplacement,
  type AutocompleteResult,
} from './emojiReplacer';
import { replaceTextRange, restoreTextareaSelection } from './emojiInsertion';

const OFFSET = 8;

export interface AutocompletePosition {
  bottom: number;
  left: number;
  width: number;
}

export interface AutocompleteState {
  results: AutocompleteResult[];
  selectedIndex: number;
  pos: AutocompletePosition;
}

interface UseEmojiAutocompleteParams {
  value: string;
  onChange: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  parentOnKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const useEmojiAutocomplete = ({
  value,
  onChange,
  textareaRef,
  parentOnKeyDown,
}: UseEmojiAutocompleteParams) => {
  const [autocomplete, setAutocomplete] = useState<AutocompleteState | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autocomplete) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!autocompleteRef.current?.contains(target) && !textareaRef.current?.contains(target)) {
        setAutocomplete(null);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [autocomplete, textareaRef]);

  const replaceAt = (source: string, start: number, length: number, emoji: string) => {
    onChange(replaceTextRange(source, start, length, emoji));
    restoreTextareaSelection(textareaRef.current, start + emoji.length);
  };

  const updateAutocomplete = (results: AutocompleteResult[]) => {
    const rect = textareaRef.current?.getBoundingClientRect();
    const pos = rect
      ? { bottom: window.innerHeight - rect.top + OFFSET, left: rect.left, width: rect.width }
      : (autocomplete?.pos ?? { bottom: 0, left: 0, width: 0 });

    setAutocomplete((previous) => ({
      results,
      selectedIndex: previous ? Math.min(previous.selectedIndex, results.length - 1) : 0,
      pos,
    }));
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    const cursor = event.target.selectionStart ?? nextValue.length;
    const beforeCursor = nextValue.slice(0, cursor);

    const results = getAutocompleteResults(beforeCursor);
    if (results.length > 0) {
      updateAutocomplete(results);
    } else {
      setAutocomplete(null);
    }

    const replacement = resolveReplacement(beforeCursor, cursor);
    if (replacement) {
      setAutocomplete(null);
      replaceAt(nextValue, replacement.start, replacement.length, replacement.emoji);
      return;
    }

    onChange(nextValue);
  };

  const selectAutocomplete = (result: AutocompleteResult) => {
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const matchLength = getPartialMatchLength(value.slice(0, cursor));
    if (matchLength === 0) return;

    replaceAt(value, cursor - matchLength, matchLength, result.emoji);
    setAutocomplete(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (autocomplete && autocomplete.results.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setAutocomplete(
          (previous) =>
            previous && {
              ...previous,
              selectedIndex: (previous.selectedIndex + 1) % previous.results.length,
            }
        );
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setAutocomplete(
          (previous) =>
            previous && {
              ...previous,
              selectedIndex:
                (previous.selectedIndex - 1 + previous.results.length) % previous.results.length,
            }
        );
        return;
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        selectAutocomplete(autocomplete.results[autocomplete.selectedIndex]);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setAutocomplete(null);
        return;
      }
    }

    parentOnKeyDown?.(event);
  };

  return {
    autocomplete,
    autocompleteRef,
    handleChange,
    handleKeyDown,
    selectAutocomplete,
  };
};
