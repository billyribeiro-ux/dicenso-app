# Information Architecture

## Entity Model

### User
- id, email, name, emailVerified, image
- preferences (JSON)
- createdAt, updatedAt

### Workspace (Personal Vault)
- id, userId
- name, slug
- settings (JSON)
- createdAt, updatedAt

### Notebook
- id, workspaceId
- name, slug, description, color
- parentId (self-referential for nesting)
- orderIndex
- createdAt, updatedAt

### Note
- id, notebookId, workspaceId, userId
- title, slug
- editorJson (Tiptap JSON)
- plainTextExtract
- status: draft | active | archived
- isPinned, isFavorite
- archivedAt, deletedAt
- createdAt, updatedAt

### NoteVersion
- id, noteId
- editorJson, plainTextExtract
- createdBy, createdAt

### Prompt
- id, workspaceId, userId
- title, body, variablesJson, examplesJson
- category, useCases
- isFavorite, version
- createdAt, updatedAt

### PromptTemplate
- id, workspaceId
- name, description
- templateBody with variable placeholders
- category
- createdAt, updatedAt

### Lesson
- id, workspaceId, userId
- title, summary, body
- status: not_started | in_progress | learned | review_later
- reviewAt, masteryLevel (1-5)
- sourceLinks (JSON)
- createdAt, updatedAt

### LessonReview
- id, lessonId
- reviewedAt, performance (1-5)
- nextReviewAt
- notes

### Task
- id, workspaceId, userId
- title, description
- status: todo | in_progress | done | cancelled
- priority: low | medium | high | urgent
- dueAt, deadlineAt, completedAt
- estimateMinutes
- recurrenceRuleId
- parentId (for subtasks)
- createdAt, updatedAt

### Subtask
- (Modeled as Task with parentId)

### Reminder
- id, taskId, noteId (polymorphic)
- remindAt
- snoozedUntil
- isDone
- createdAt, updatedAt

### RecurrenceRule
- id
- frequency: daily | weekly | monthly | yearly | custom
- interval, daysOfWeek, dayOfMonth
- endDate, maxOccurrences
- createdAt

### DailyPlan
- id, workspaceId, userId
- date
- planText, reflectionsText
- focusSessionIds (JSON)
- createdAt, updatedAt

### FocusSession
- id, userId, taskId (nullable)
- startedAt, endedAt
- durationSeconds, elapsedSeconds
- mode: pomodoro | stopwatch | countdown
- presetId
- interrupted, paused
- createdAt, updatedAt

### TimerPreset
- id, userId
- name, durationMinutes, mode
- isDefault
- createdAt, updatedAt

### Tag
- id, workspaceId
- name, normalizedName, color
- createdAt, updatedAt

### EntityTag (join table)
- id, tagId, entityType, entityId
- createdAt

### Attachment
- id, workspaceId, userId
- filename, originalName, mimeType, sizeBytes
- storagePath, url
- entityType, entityId (polymorphic)
- createdAt, updatedAt

### SavedView
- id, workspaceId, userId
- name, entityType
- filters (JSON)
- sortConfig (JSON)
- createdAt, updatedAt

### SmartFilter
- (Modeled as SavedView with isSmart = true)

### Favorite / Pin
- (Polymorphic via entityType/entityId on relevant entities)

### ActivityLog
- id, workspaceId, userId
- action, entityType, entityId
- metadata (JSON)
- createdAt

### TrashRecord
- id, workspaceId, userId
- entityType, entityId
- entityData (JSON backup)
- deletedAt, expiresAt
- restoredAt

### Settings / Preferences
- id, userId
- theme, density, fontSize
- sidebarCollapsed, sidebarWidth
- startPage, reminderDefaults
- reducedMotion
- createdAt, updatedAt

## Relationships
- User 1:1 Workspace (initially)
- Workspace 1:N Notebooks, Notes, Prompts, Lessons, Tasks, Tags, SavedViews
- Notebook 1:N Notes, self-referential for nesting
- Note 1:N NoteVersions, N:1 Notebook
- Task 1:N Subtasks (self-referential), 0:1 RecurrenceRule
- Lesson 1:N LessonReviews
- Tag N:M Notes, Prompts, Lessons, Tasks via EntityTag
- FocusSession N:1 Task (optional)

## Indexes
- Note: userId + updatedAt, notebookId, deletedAt + status
- Task: userId + dueAt, userId + status, parentId
- Prompt: userId + category, userId + isFavorite
- Lesson: userId + reviewAt, userId + status
- Tag: workspaceId + normalizedName (unique)
- EntityTag: tagId + entityType + entityId (unique), entityType + entityId
- Search: GIN indexes on tsvector for title/content search
