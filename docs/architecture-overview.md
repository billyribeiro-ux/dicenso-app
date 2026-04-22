# Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Next.js   │ │  Tiptap     │ │   Dexie / IndexedDB │   │
│  │  App Router │ │  Editor     │ │   (source of truth) │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │  Fuse.js    │ │   Export/   │ │   Local Timer       │   │
│  │  (search)   │ │   Import    │ │   State             │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Storage Adapter Layer                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │  NotesRepo  │ │  TasksRepo  │ │  PromptsRepo        │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ LessonsRepo │ │  TagsRepo   │ │  SettingsRepo       │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow
1. **Reads**: Repository queries Dexie → returns typed entities → React state
2. **Writes**: UI action → repository method → Dexie transaction → reactive update
3. **Autosave**: Editor debounce → draft save → repository upsert
4. **Export**: Repository dump → JSON validation → file download
5. **Import**: File upload → JSON validation → dry run → repository insert

## Layer Responsibilities

### Presentation Layer
- React Client Components for all interactive UI (no server data needed)
- Tailwind CSS for styling
- Radix primitives for accessibility

### Application Layer
- Custom hooks for domain operations
- React Context for global state (settings, search index)
- Local storage for lightweight preferences

### Domain Layer
- Zod schemas for validation
- TypeScript types shared across layers
- Business rules in hooks and repositories

### Infrastructure Layer
- Dexie/IndexedDB for all persistence
- Local file system for export/import
- In-memory search indices

## Key Patterns
- **Repository Pattern**: All storage access goes through typed repositories
- **Optimistic UI**: Immediate state update, background persistence
- **Single source of truth**: IndexedDB is canonical
- **Schema versioning**: Dexie migrations handle schema evolution
