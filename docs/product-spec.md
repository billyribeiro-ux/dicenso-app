# Product Specification: DiCenso

## Vision
A premium personal knowledge and execution operating system. The single source of truth for notes, prompts, lessons, tasks, reminders, and focused work.

## Product Pillars

### Pillar A: Capture Fast
- Universal quick capture (Cmd+Shift+N)
- Natural language parsing for tasks with dates
- Inbox for unprocessed captures
- Paste-to-create for images and text
- Drag-and-drop attachment support

### Pillar B: Organize Deeply
- Notebooks / collections
- Tags with colors
- Smart filters and saved views
- Pinning and favorites
- Archive and trash with restore
- Backlinks between entities

### Pillar C: Execute Daily
- Today view with tasks, reminders, and focus
- Upcoming view for planning
- Overdue task handling
- Recurring tasks with flexible rules
- Pomodoro and focus timer
- Daily notes

### Pillar D: Learn and Retain
- Lesson vault with review scheduling
- Key takeaways and summaries
- Source links and references
- Mastery level tracking
- Spaced repetition-ready architecture

### Pillar E: Retrieve Instantly
- Command palette (Cmd+K)
- Global search with filters
- Quick open (Cmd+P)
- Recent items
- Tag browser
- In-note search

### Pillar F: Feel World-Class
- macOS-inspired premium aesthetic
- Keyboard-first workflows
- Satisfying micro-interactions
- Beautiful empty states
- Reduced motion support
- Excellent accessibility

## Feature Matrix
See `/docs/feature-matrix.md` for detailed capabilities per entity.

## User Flows
1. **Morning planning**: Open app → Today view → review tasks → start focus session
2. **Quick capture**: Cmd+Shift+N → type task/note/prompt → enter → back to work
3. **Deep writing**: Cmd+N → write in editor → autosave → add tags → done
4. **Learning session**: Open Lessons → create lesson → add takeaways → schedule review
5. **Prompt usage**: Open Prompts → find prompt → copy → use in external tool
6. **End of day**: Review completed tasks → add daily note → plan tomorrow

## Success Metrics
- Capture-to-done in < 3 seconds for quick capture
- Editor ready in < 1 second after navigation
- Search results in < 100ms (local), < 300ms (server)
- Timer survives 100% of tab refreshes
- Zero data loss on network interruption
