# Assumptions

## Product Assumptions
1. **Single-user local-first**: The app is a personal productivity system. No multi-user in v1.
2. **English primary language**: NLP parsing assumes English input initially.
3. **Modern browser target**: Chrome 110+, Safari 16+, Firefox 110+. No IE11.
4. **macOS primary, web secondary, tablet tertiary**: Keyboard shortcuts use Cmd (⌘). Windows/Linux fallback with Ctrl.
5. **No external database required for v1**: IndexedDB is the source of truth.
6. **No native mobile apps initially**: PWA-capable web app.
7. **No real-time collaboration initially**: Single-user local system.

## Technical Assumptions
1. **Next.js App Router**: For rendering and routing, not for server-side data.
2. **Dexie + IndexedDB**: Primary persistence. Typed, robust, migration-capable.
3. **Tiptap editor**: ProseMirror-based rich text with JSON output.
4. **Tailwind CSS v4**: Tokenized design system.
5. **Zod**: Validation for import/export and local data integrity.
6. **date-fns + chrono-node**: Date manipulation and natural language parsing.
7. **fuse.js**: Local fuzzy search.
8. **Storage Adapter Pattern**: All domain logic talks to repositories, not IndexedDB directly.

## Design Assumptions
1. **macOS aesthetic**: Layered surfaces, crisp borders, refined shadows.
2. **Inter font stack**: System fonts preferred; Inter for consistency.
3. **No custom illustration library**: Empty states use elegant iconography and typography.

## Scope Boundaries
1. **No third-party calendar sync initially**.
2. **No email/SMS delivery**: In-app reminders + browser notifications only.
3. **No AI/LLM integration in v1**.
4. **No import from Notion/Evernote in v1**: Markdown + JSON backup import only.
5. **No mandatory account creation**.
6. **No cloud sync in v1**.
