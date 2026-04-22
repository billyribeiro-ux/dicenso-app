# DiCenso

Your personal knowledge and execution operating system.

## Features

- **Notes**: Rich text editor with Tiptap, autosave, version history, pinning, favorites, archive
- **Tasks**: Create, complete, prioritize, due dates, overdue tracking
- **Prompts**: Store and organize AI prompts with copy functionality
- **Lessons**: Track learning with review scheduling and mastery levels
- **Brainstorm**: Freeform idea capture
- **Daily Planning**: Today view with tasks, focus timer, and daily notes
- **Focus Timer**: Pomodoro timer that survives refresh
- **Search**: Global search across all content types
- **Quick Capture**: Universal capture modal with keyboard shortcut
- **Command Palette**: `Cmd+K` for navigation and actions
- **Local-First**: All data stored in IndexedDB, no server required
- **Export/Import**: Full vault backup and restore
- **Offline**: Works without internet after initial load
- **Dark Mode**: System-aware theme switching

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript (strict)
- Tailwind CSS v4
- Dexie (IndexedDB wrapper)
- Tiptap (ProseMirror editor)
- Radix UI primitives
- Lucide icons

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Command palette |
| `Cmd+Shift+N` | Quick capture |
| `Cmd+N` | New note |
| `Cmd+1-6` | Navigate sections |
| `Cmd+Enter` | Save / confirm |
| `Esc` | Close modal |

## Architecture

This is a **local-first** application. All data persists in the browser's IndexedDB using Dexie.

- **Storage Adapter Pattern**: Repositories abstract IndexedDB access
- **Client Components**: All interactive UI is client-side
- **No Server Database Required**: Works entirely offline
- **Export/Import**: JSON-based backup and restore

## Data Model

See `docs/` for full architecture documentation:
- `docs/product-spec.md`
- `docs/architecture-overview.md`
- `docs/data-model.md`
- `docs/sync-strategy.md`
- `docs/search-strategy.md`
- `docs/editor-architecture.md`
- `docs/accessibility.md`
- `docs/performance.md`
- `docs/security.md`
- `docs/testing-strategy.md`
- `docs/adrs/`

## License

MIT
