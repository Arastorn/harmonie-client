# EmojiTextarea

`EmojiTextarea` is a `Textarea` enhanced with two UX behaviors:

- emoji insertion through a picker
- inline shortcode/emoticon autocomplete and replacement

## Structure

`EmojiTextarea.tsx`

It assembles:

- the `Textarea`
- the picker trigger button
- the picker popup
- the autocomplete popup

It should contain as little behavior-specific logic as possible.

### `useEmojiPicker.ts`

Picker management hook.

Responsibilities:

- open / close the picker
- compute its screen position
- close it on outside click
- insert the selected emoji at the current cursor position
- restore focus and cursor position after insertion

### `useEmojiAutocomplete.ts`

Autocomplete management hook.

Responsibilities:

- detect a partial shortcode before the cursor
- compute and expose suggestions
- handle keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Tab`, `Escape`)
- select a suggestion
- trigger automatic replacement when a full shortcode or supported emoticon is detected

### `emojiReplacer.ts`

Pure text-to-emoji parsing logic.

Responsibilities:

- detect full `:shortcode:` matches
- detect partial shortcodes for autocomplete
- detect supported emoticons such as `:)`
- return the data needed to perform a replacement

This file renders nothing and has no React dependency.

### `emojiInsertion.ts`

Pure text and selection helpers.

Responsibilities:

- replace a text range
- insert text into the current selection
- restore the cursor position inside the textarea

## Main flows

### Picker

1. The user clicks the emoji button.
2. `useEmojiPicker` opens and positions the picker.
3. The user selects an emoji.
4. The emoji is inserted into the text at the current selection.
5. Focus and cursor position are restored in the `textarea`.

### Autocomplete

1. The user types a shortcode prefix, for example `:smi`.
2. `useEmojiAutocomplete` calls `emojiReplacer.ts` to get suggestions.
3. `EmojiAutocomplete.tsx` renders the suggestion list.
4. The user confirms a suggestion with the keyboard or mouse.
5. The partial shortcode is replaced with the matching emoji.

### Automatic replacement

1. The user completes a full shortcode or types a supported emoticon.
2. `useEmojiAutocomplete` calls `resolveReplacement`.
3. The recognized text is immediately replaced with the matching emoji.

## Architecture rule

As long as this logic only supports `EmojiTextarea` behavior, it belongs in `packages/ui`.

If the emoji parsing logic ever needs to be reused outside this React component, `emojiReplacer.ts` could be moved into a dedicated shared module.
