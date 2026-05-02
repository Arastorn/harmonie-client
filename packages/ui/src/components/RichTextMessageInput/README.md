# RichTextMessageInput

`RichTextMessageInput` is the rich message composer field used for message editing flows.

It combines:

- a Quill-based rich text editor
- emoji picker support
- `:smile` autocomplete and replacement
- formatting toolbar actions
- link bubble and link dialog flows

## When To Use It

Use this component for message-like inputs where formatted HTML content is expected.

Examples:

- channel message composer
- inline message editing

Do not use it for simple profile or form text fields. For those, prefer `PlainEmojiTextarea`.

## Structure

The module is split by responsibility:

- `components/`
  Presentational subcomponents such as the toolbar and link UI.
- `hooks/`
  State and interaction logic for Quill, autocomplete, and links.
- `utils/`
  Pure helpers for editor content, links, toolbar config, and constants.
- `types.ts`
  Shared local types for the module.
