import type DexieType from 'dexie';
import type { EntityTable } from 'dexie';
import type {
  Note,
  NoteVersion,
  Notebook,
  Prompt,
  PromptTemplate,
  Lesson,
  LessonReview,
  Task,
  Reminder,
  RecurrenceRule,
  DailyPlan,
  FocusSession,
  TimerPreset,
  Tag,
  EntityTag,
  Attachment,
  SavedView,
  Backlink,
  TrashRecord,
  ActivityLog,
  UserSettings,
} from '@/types';

const DB_NAME = 'dicenso-vault';
const DB_VERSION = 1;

export interface DicensoDatabase extends DexieType {
  notes: EntityTable<Note, 'id'>;
  noteVersions: EntityTable<NoteVersion, 'id'>;
  notebooks: EntityTable<Notebook, 'id'>;
  prompts: EntityTable<Prompt, 'id'>;
  promptTemplates: EntityTable<PromptTemplate, 'id'>;
  lessons: EntityTable<Lesson, 'id'>;
  lessonReviews: EntityTable<LessonReview, 'id'>;
  tasks: EntityTable<Task, 'id'>;
  reminders: EntityTable<Reminder, 'id'>;
  recurrenceRules: EntityTable<RecurrenceRule, 'id'>;
  dailyPlans: EntityTable<DailyPlan, 'id'>;
  focusSessions: EntityTable<FocusSession, 'id'>;
  timerPresets: EntityTable<TimerPreset, 'id'>;
  tags: EntityTable<Tag, 'id'>;
  entityTags: EntityTable<EntityTag, 'id'>;
  attachments: EntityTable<Attachment, 'id'>;
  savedViews: EntityTable<SavedView, 'id'>;
  backlinks: EntityTable<Backlink, 'id'>;
  trashRecords: EntityTable<TrashRecord, 'id'>;
  activityLogs: EntityTable<ActivityLog, 'id'>;
  settings: EntityTable<UserSettings, 'id'>;
}

let db: DicensoDatabase | null = null;

async function initDb(): Promise<DicensoDatabase> {
  if (db) return db;
  if (typeof window === 'undefined') {
    throw new Error('Dexie can only be initialized in the browser');
  }

  const [{ default: Dexie }, { default: dexieExportImport }] = await Promise.all([
    import('dexie'),
    import('dexie-export-import'),
  ]);

  const database = new Dexie(DB_NAME) as unknown as DicensoDatabase;

  database.version(DB_VERSION).stores({
    notes: 'id, [userId+updatedAt], notebookId, [deletedAt+status], [userId+status]',
    noteVersions: 'id, noteId, [noteId+createdAt]',
    notebooks: 'id, [workspaceId+slug], parentId',
    prompts: 'id, [userId+category], [userId+isFavorite]',
    promptTemplates: 'id, workspaceId',
    lessons: 'id, [userId+status], [userId+reviewAt]',
    lessonReviews: 'id, lessonId, [lessonId+createdAt]',
    tasks: 'id, [userId+status], [userId+dueAt], parentId',
    reminders: 'id, [taskId+remindAt], [noteId+remindAt]',
    recurrenceRules: 'id',
    dailyPlans: 'id, [workspaceId+date]',
    focusSessions: 'id, [userId+startedAt]',
    timerPresets: 'id, workspaceId',
    tags: 'id, [workspaceId+normalizedName]',
    entityTags: 'id, [entityType+entityId], tagId',
    attachments: 'id, [entityType+entityId]',
    savedViews: 'id, workspaceId',
    backlinks: 'id, [sourceNoteId+targetNoteId]',
    trashRecords: 'id, [workspaceId+deletedAt]',
    activityLogs: 'id, [workspaceId+createdAt]',
    settings: 'id, userId',
  });

  db = database;
  return db;
}

export async function getDb(): Promise<DicensoDatabase> {
  return initDb();
}

export async function exportDb(): Promise<Blob> {
  const database = await getDb();
  return (database as unknown as { export: (opts: { prettyJson: boolean }) => Promise<Blob> }).export({ prettyJson: true });
}

export async function importDb(blob: Blob, clearBeforeImport = false): Promise<void> {
  const database = await getDb();
  await (database as unknown as { import: (blob: Blob, opts: { clearTablesBeforeImport: boolean }) => Promise<void> }).import(blob, { clearTablesBeforeImport: clearBeforeImport });
}

export async function resetDb(): Promise<void> {
  if (db) {
    await (db as unknown as { delete: () => Promise<void> }).delete();
    db = null;
  }
}
