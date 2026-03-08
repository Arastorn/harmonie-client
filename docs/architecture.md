# Harmonie — Project Architecture

## Overview

Harmonie is a monorepo containing two workspaces:

| Workspace | npm name | Role |
|---|---|---|
| `apps/harmonie` | `@harmonie/app` | Main React application |
| `packages/ui` | `@harmonie/ui` | Design system: UI components + Storybook |

---

## Tech stack

| Tool | Usage |
|---|---|
| **pnpm** | Package manager + workspaces |
| **Turborepo** | Monorepo task orchestration (build, dev, lint) |
| **Vite** | Bundler (SPA mode for app, library mode for UI) |
| **React 18** | UI framework |
| **TypeScript 5** | Static typing |
| **Tailwind CSS v4** | Styling — used in `packages/ui` and `apps/harmonie` |
| **Storybook 8** | Component development and documentation in isolation |
| **React Router v6** | Client-side routing |

---

## Folder structure

```
harmonie-client/
├── package.json              # Workspace root — Turborepo scripts
├── pnpm-workspace.yaml       # pnpm workspaces declaration
├── turbo.json                # Turborepo pipeline
├── .npmrc                    # pnpm configuration
├── docs/
│   └── architecture.md       # This file
├── apps/
│   └── harmonie/             # Main application
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── index.html
│       └── src/
│           ├── main.tsx          # Entry point
│           ├── routes/
│           │   └── index.tsx     # createBrowserRouter
│           ├── layouts/
│           │   └── AppLayout.tsx # 3-column layout + <Outlet />
│           └── features/
│               ├── auth/
│               │   ├── useAuth.ts        # Auth state hook (stub)
│               │   ├── RequireAuth.tsx   # Redirects to /auth/connect if not authenticated
│               │   ├── GuestRoute.tsx    # Redirects to / if authenticated
│               │   ├── ConnectPage.tsx   # Login page
│               │   └── RegisterPage.tsx  # Registration page
│               ├── chat/
│               ├── sidebar/
│               ├── voice/
│               └── guild/
└── packages/
    └── ui/                   # Design system
        ├── package.json
        ├── vite.config.ts    # Library mode — externalizes React
        ├── tsconfig.json
        ├── .storybook/
        │   ├── main.ts
        │   ├── preview.ts
        │   └── preview-head.html  # Google Fonts injection
        └── src/
            ├── index.ts      # Barrel export of all components
            └── components/
                └── [ComponentName]/
                    ├── ComponentName.tsx
                    ├── ComponentName.stories.tsx
                    └── index.ts
```

---

## Tailwind CSS

Tailwind v4 is used in both workspaces with a CSS-first approach — no `tailwind.config.ts`.

### Setup in `packages/ui`

- `src/styles/index.css` — `@import "tailwindcss"` + `@theme {}` with all Harmonie design tokens

### Setup in `apps/harmonie`

- `src/styles/index.css` — imports the UI package styles to inherit all tokens

### Component styling convention

Design system components use Tailwind classes directly in JSX. For complex variants, `clsx` or `cva` (class-variance-authority) is used:

```tsx
// Button example
<button className={clsx(
  'inline-flex items-center font-medium rounded-lg transition-opacity',
  variant === 'primary' && 'bg-primary text-primary-fg',
  variant === 'ghost' && 'border border-border-2 text-text-1',
)}>
```

---

## UI components (`packages/ui`)

### Folder convention

Each component lives in its own folder:

```
src/components/Button/
├── Button.tsx          # React component + exported types
├── Button.stories.tsx  # Storybook stories
└── index.ts            # Public re-export: export { Button } from './Button'
```

All dumb/presentational components live in `packages/ui`. The app never defines its own UI primitives.

### Exports

`src/index.ts` exports all components and their types:

```ts
export { Button } from './components/Button'
export type { ButtonProps } from './components/Button'
```

---

## Application (`apps/harmonie`)

### Routing (React Router v6)

```
/auth                → GuestRoute (redirects to / if authenticated)
  /auth              → redirect to /auth/connect
  /auth/connect      → ConnectPage  (login)
  /auth/register     → RegisterPage (registration)

/                    → RequireAuth (redirects to /auth/connect if not authenticated)
  /                  → AppLayout
    /                → GuildSelectorPage  (index)
    /:serverId/:guildId/channel/:channelId → ChatPage
    /:serverId/:guildId/voice/:channelId   → VoicePage

*                    → redirect to /
```

### Feature folders

Each feature folder is self-contained and owns its pages, hooks, and components:

```
features/auth/       → auth pages, route guards, useAuth hook
features/chat/       → chat feature (Phase 7+)
features/guild/      → guild/server feature (Phase 7+)
features/sidebar/    → sidebar feature (Phase 7+)
features/voice/      → voice feature (Phase 7+)
```

### Main layout

`AppLayout` is a 3-column flex layout:

```
┌──────┬────────────────┬─────────────────────────────┐
│      │                │                             │
│Server│  Guild sidebar │     <Outlet />              │
│ Rail │  (channels,    │     (ChatPage, VoicePage,   │
│      │   user panel)  │      GuildSelectorPage)     │
│      │                │                             │
└──────┴────────────────┴─────────────────────────────┘
```

### Consuming the design system

```ts
import { Button, Input } from '@harmonie/ui'
```

---

## Dev commands

```bash
# Install dependencies (links workspaces)
pnpm install

# Start all servers in parallel
turbo run dev

# Start Storybook only
pnpm --filter @harmonie/ui storybook

# Start the app only
pnpm --filter @harmonie/app dev

# Build all packages
turbo run build

# Build the design system only
pnpm --filter @harmonie/ui build

# Build the app only
pnpm --filter @harmonie/app build
```

---

## Architectural decisions

### Why Turborepo + pnpm?
Turborepo manages build order (the design system must build before the app) and caches results. pnpm workspaces provides a strict `node_modules` layout and the `workspace:*` protocol for local dependencies.

### Why Tailwind v4?
Tailwind v4 is the current version. Its CSS-first approach integrates naturally with Vite. The shared token definition in `packages/ui/src/styles/index.css` guarantees visual consistency across the entire project.

### Why Storybook separate from the app?
Storybook lives exclusively in `packages/ui`, which forces components to be developed independently from the app. This ensures the design system is reusable and not coupled to business logic.

### Why Vite in library mode for `packages/ui`?
Vite in library mode produces an optimized ES bundle without duplicating React (externalized). `vite-plugin-dts` generates TypeScript declarations.

### Why feature folders?
Each feature (auth, chat, guild…) owns its pages, hooks, and components. This avoids a generic `components/` or `pages/` folder that becomes a dumping ground. All dumb UI primitives go to `packages/ui`; everything domain-specific lives in its feature folder.
