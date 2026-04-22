# Sync Strategy

## Philosophy
Local-first with optional future sync. The app must never lose user input.

## Current State (v1)
No sync. All data lives in IndexedDB.

## Local Persistence Strategy

### 1. Dexie Transactions
All writes use Dexie transactions for atomicity.

### 2. Autosave
- Editor: debounce 500ms → save to `notes` table
- Tasks/Lessons/Prompts: immediate save on change
- Visual indicator: "Saving..." → "Saved" or "Error"

### 3. Draft Recovery
- Unsaved new notes stored in `notes` with `status: 'draft'`
- On app startup, check for drafts and surface them
- Explicit discard required to delete drafts

### 4. Conflict Resolution
- Last-write-wins for v1 (single user)
- Version integers on notes/prompts for future sync

### 5. Backup
- Manual export: full vault as JSON
- Automatic backup: optional periodic export to Downloads
- Import: validation → dry run → apply

## Future Sync Architecture (Optional)
A sync adapter layer can be added later:
```
Local Repository → Sync Engine → Remote Adapter → Cloud Storage
```
Sync engine would:
1. Queue local changes
2. Push to remote
3. Pull remote changes
4. Resolve conflicts with version vectors

This is intentionally not built in v1 to avoid complexity and cloud dependency.
