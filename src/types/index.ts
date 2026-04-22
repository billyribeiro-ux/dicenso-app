export type EntityType = 'note' | 'prompt' | 'lesson' | 'task' | 'attachment';

export type NoteStatus = 'draft' | 'active' | 'archived';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type LessonStatus = 'not_started' | 'in_progress' | 'learned' | 'review_later';

export type TimerMode = 'pomodoro' | 'stopwatch' | 'countdown';

export type Theme = 'light' | 'dark' | 'system';
export type Density = 'compact' | 'comfortable';
export type FontSize = 'small' | 'medium' | 'large';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notebook extends BaseEntity {
  workspaceId: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  parentId?: string;
  orderIndex: number;
}

export interface Note extends BaseEntity {
  workspaceId: string;
  userId: string;
  notebookId?: string;
  title: string;
  slug: string;
  editorJson: Record<string, unknown>;
  plainTextExtract?: string;
  status: NoteStatus;
  isPinned: boolean;
  isFavorite: boolean;
  archivedAt?: Date;
  deletedAt?: Date;
  version: number;
}

export interface NoteVersion extends BaseEntity {
  noteId: string;
  editorJson: Record<string, unknown>;
  plainTextExtract?: string;
  createdBy: string;
}

export interface Prompt extends BaseEntity {
  workspaceId: string;
  userId: string;
  title: string;
  body: string;
  variablesJson?: unknown[];
  examplesJson?: unknown[];
  category: string;
  useCases?: string;
  isFavorite: boolean;
  version: number;
}

export interface PromptTemplate extends BaseEntity {
  workspaceId: string;
  name: string;
  description?: string;
  templateBody: string;
  category: string;
}

export interface Lesson extends BaseEntity {
  workspaceId: string;
  userId: string;
  title: string;
  summary?: string;
  body?: string;
  status: LessonStatus;
  reviewAt?: Date;
  masteryLevel: number;
  sourceLinks?: unknown[];
}

export interface LessonReview extends BaseEntity {
  lessonId: string;
  reviewedAt: Date;
  performance: number;
  nextReviewAt?: Date;
  notes?: string;
}

export interface Task extends BaseEntity {
  workspaceId: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: Date;
  deadlineAt?: Date;
  completedAt?: Date;
  estimateMinutes?: number;
  recurrenceRuleId?: string;
  parentId?: string;
}

export interface Reminder extends BaseEntity {
  taskId?: string;
  noteId?: string;
  remindAt: Date;
  snoozedUntil?: Date;
  isDone: boolean;
}

export interface RecurrenceRule extends BaseEntity {
  frequency: string;
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: Date;
  maxOccurrences?: number;
}

export interface DailyPlan extends BaseEntity {
  workspaceId: string;
  userId: string;
  date: Date;
  planText?: string;
  reflectionsText?: string;
}

export interface FocusSession extends BaseEntity {
  workspaceId: string;
  userId: string;
  taskId?: string;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds: number;
  elapsedSeconds: number;
  mode: TimerMode;
  presetId?: string;
  interrupted: boolean;
  paused: boolean;
}

export interface TimerPreset extends BaseEntity {
  workspaceId: string;
  userId: string;
  name: string;
  durationMinutes: number;
  mode: TimerMode;
  isDefault: boolean;
}

export interface Tag extends BaseEntity {
  workspaceId: string;
  name: string;
  normalizedName: string;
  color: string;
}

export interface EntityTag extends BaseEntity {
  tagId: string;
  entityType: EntityType;
  entityId: string;
}

export interface Attachment extends BaseEntity {
  workspaceId: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  url: string;
  entityType?: EntityType;
  entityId?: string;
}

export interface SavedView extends BaseEntity {
  workspaceId: string;
  userId: string;
  name: string;
  entityType: string;
  filters?: Record<string, unknown>;
  sortConfig?: Record<string, unknown>;
  isSmart: boolean;
}

export interface Backlink extends BaseEntity {
  sourceNoteId: string;
  targetNoteId: string;
  contextText?: string;
}

export interface TrashRecord extends BaseEntity {
  workspaceId: string;
  userId: string;
  entityType: EntityType;
  entityId: string;
  entityData: Record<string, unknown>;
  deletedAt: Date;
  expiresAt: Date;
  restoredAt?: Date;
}

export interface ActivityLog extends BaseEntity {
  workspaceId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export interface UserSettings extends BaseEntity {
  userId: string;
  theme: Theme;
  density: Density;
  fontSize: FontSize;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  startPage: string;
  reducedMotion: boolean;
  reminderDefaults?: Record<string, unknown>;
  pinLock?: string;
  passphraseLock?: string;
}

export interface SearchableItem {
  id: string;
  type: EntityType | 'command';
  title: string;
  subtitle?: string;
  icon?: string;
  href?: string;
  action?: () => void;
}

export interface ExportVault {
  version: number;
  exportedAt: string;
  appVersion: string;
  notes: Note[];
  notebooks: Notebook[];
  prompts: Prompt[];
  lessons: Lesson[];
  tasks: Task[];
  tags: Tag[];
  entityTags: EntityTag[];
  reminders: Reminder[];
  focusSessions: FocusSession[];
  timerPresets: TimerPreset[];
  dailyPlans: DailyPlan[];
  savedViews: SavedView[];
  settings: UserSettings;
}
