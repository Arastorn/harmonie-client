// Light — Linen
export const LIGHT_THEMES = ['default', 'azure-linen', 'rose-linen', 'mint-linen'] as const;

// Dark — Obsidian
export const DARK_THEMES = [
  'forest-obsidian',
  'midnight-obsidian',
  'black-obsidian',
  'emerald-obsidian',
  'crimson-obsidian',
  'amethyst-obsidian',
  'rose-obsidian',
] as const;

export const THEMES = [...LIGHT_THEMES, ...DARK_THEMES] as const;

export type Theme = (typeof THEMES)[number];
