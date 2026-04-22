# Data Model

## Dexie Schema (IndexedDB)

See `src/lib/db.ts` for the authoritative schema definition.

## Design Principles
1. **Local-first**: IndexedDB is the only required persistence.
2. **Schema versioning**: Dexie upgrades handle migration between versions.
3. **CUID primary keys**: Safe client-side generation with `uuid` v4.
4. **Timestamps everywhere**: `createdAt` and `updatedAt` on every table.
5. **JSON for flexible data**: Editor content, prompt variables, settings stored as JSON.
6. **Soft deletes**: All user content uses `deletedAt` with trash recovery.
7. **Version history**: Notes and prompts keep local version snapshots.

## Tables

| Table | Primary Key | Indexes |
|-------|-------------|---------|
| notes | id | userId, notebookId, updatedAt, status, deletedAt |
| noteVersions | id | noteId, createdAt |
| notebooks | id | workspaceId, parentId |
| prompts | id | userId, category, isFavorite |
| promptTemplates | id | workspaceId |
| lessons | id | userId, status, reviewAt |
| lessonReviews | id | lessonId |
| tasks | id | userId, status, dueAt, parentId |
| reminders | id | taskId, remindAt |
| recurrenceRules | id | - |
| dailyPlans | id | workspaceId, date |
| focusSessions | id | userId, startedAt |
| timerPresets | id | workspaceId |
| tags | id | workspaceId, normalizedName |
| entityTags | id | entityType, entityId |
| attachments | id | entityType, entityId |
| savedViews | id | workspaceId |
| backlinks | id | sourceNoteId, targetNoteId |
| trashRecords | id | workspaceId, deletedAt |
| activityLogs | id | workspaceId, createdAt |
| settings | id | userId |

## Full-Text Search
Local search via Fuse.js over in-memory indices:
- `Note`: title + plainTextExtract
- `Prompt`: title + body
- `Lesson`: title + summary + body
- `Task`: title + description

Indices rebuilt on app load and after mutations.
