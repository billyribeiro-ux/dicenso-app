# Editor Architecture

## Technology Choice: Tiptap 2.x

**Rationale**:
- ProseMirror foundation = proven, extensible, collaboration-ready
- Excellent TypeScript support
- Active ecosystem of extensions
- Headless = full design control
- JSON serialization = structured content, easy versioning

## Extensions Stack
| Extension | Purpose |
|-----------|---------|
| StarterKit | Basic marks and nodes |
| Placeholder | Empty editor hint |
| Underline | Text formatting |
| Highlight | Text highlighting |
| TaskList + TaskItem | Checklists |
| Table + TableRow + TableCell + TableHeader | Tables |
| Link | URL links with auto-detection |
| Image | Image uploads |
| CodeBlockLowlight | Syntax highlighted code |
| Typography | Smart quotes, em dash |
| SlashCommands | `/` menu for blocks |
| Placeholder | Empty state text |

## Document Schema
All content stored as Tiptap JSON in `editorJson` field.
Plain text extracted and stored in `plainTextExtract` for search.

## Autosave Flow
1. User types → Tiptap onUpdate callback
2. Debounce 500ms → save to IndexedDB draft
3. Debounce 2000ms → attempt server save
4. Visual indicator: "Saving..." → "Saved" or "Offline - draft saved"

## Version History
- On explicit save or autosave: create NoteVersion snapshot
- Keep last 50 versions
- User can browse and restore previous versions
- Diff view between versions (future)

## Future Collaboration
- ProseMirror supports OT/CRDT out of the box
- Yjs integration possible with Y.Tiptap collaboration extension
- Presence cursors and selections ready
