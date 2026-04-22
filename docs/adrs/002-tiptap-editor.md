# ADR 002: Tiptap Rich Text Editor

## Status
Accepted

## Context
Need a robust, extensible rich text editor for notes.

## Decision
Use Tiptap 2.x (ProseMirror-based).

## Rationale
- Structured JSON output (not HTML)
- Excellent extension ecosystem
- Headless = full design control
- Proven collaboration architecture (Yjs ready)
- Strong TypeScript support

## Alternatives Considered
- Slate: Less ecosystem, more custom code
- Lexical: Facebook, newer, less mature ecosystem
- Quill: Outdated architecture, not structured

## Consequences
- Must configure extensions individually
- Need custom slash command implementation
- ProseMirror learning curve for advanced features
