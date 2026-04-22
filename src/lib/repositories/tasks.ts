import { getDb } from '@/lib/db';
import { BaseRepository } from './base';
import type { Task, Reminder } from '@/types';
import { startOfDay, endOfDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import {
  createShared,
  deleteShared,
  getSharedById,
  listShared,
  updateShared,
  upsertManyShared,
} from '@/lib/shared-entity-client';

const LEGACY_TASKS_MIGRATION_KEY = 'dicenso:tasks-migrated:v1';
const TASK_DATE_FIELDS = ['createdAt', 'updatedAt', 'dueAt', 'deadlineAt', 'completedAt'] as const;

class TasksRepository {
  private migrationPromise: Promise<void> | null = null;

  private async legacyTable() {
    return (await getDb()).tasks;
  }

  private async ensureLegacyMigration(userId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(LEGACY_TASKS_MIGRATION_KEY) === '1') return;
    if (this.migrationPromise) return this.migrationPromise;
    this.migrationPromise = (async () => {
      try {
        const legacy = await (await this.legacyTable()).where({ userId }).toArray();
        if (legacy.length > 0) {
          await upsertManyShared('tasks', legacy, TASK_DATE_FIELDS);
        }
        localStorage.setItem(LEGACY_TASKS_MIGRATION_KEY, '1');
      } finally {
        this.migrationPromise = null;
      }
    })();
    await this.migrationPromise;
  }

  async getById(id: string): Promise<Task | undefined> {
    try {
      return await getSharedById<Task>('tasks', id, TASK_DATE_FIELDS);
    } catch {
      return (await this.legacyTable()).get(id);
    }
  }

  async create(entity: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const now = new Date();
    const task: Task = { ...entity, id: uuidv4(), createdAt: now, updatedAt: now };
    try {
      return await createShared<Task>('tasks', task, TASK_DATE_FIELDS);
    } catch {
      await (await this.legacyTable()).add(task);
      return task;
    }
  }

  async update(
    id: string,
    changes: Partial<Omit<Task, 'id' | 'createdAt'>>,
  ): Promise<Task | undefined> {
    const payload: Record<string, unknown> = { ...changes, updatedAt: new Date() };
    try {
      return await updateShared<Task>('tasks', id, payload, TASK_DATE_FIELDS);
    } catch {
      const t = await this.legacyTable();
      await t.update(id, { ...(changes as Partial<Task>), updatedAt: new Date() });
      return t.get(id);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteShared('tasks', id);
    } catch {
      await (await this.legacyTable()).delete(id);
    }
  }

  async getByUser(userId: string): Promise<Task[]> {
    await this.ensureLegacyMigration(userId);
    let all: Task[];
    try {
      all = await listShared<Task>('tasks', userId, TASK_DATE_FIELDS);
    } catch {
      all = await (await this.legacyTable()).where({ userId }).reverse().sortBy('updatedAt');
    }
    return all.filter((t) => !t.completedAt);
  }

  async getByStatus(userId: string, status: Task['status']): Promise<Task[]> {
    const all = await this.getAllByUser(userId);
    return all.filter((t) => t.status === status);
  }

  private async getAllByUser(userId: string): Promise<Task[]> {
    await this.ensureLegacyMigration(userId);
    try {
      return await listShared<Task>('tasks', userId, TASK_DATE_FIELDS);
    } catch {
      return (await this.legacyTable()).where({ userId }).reverse().sortBy('updatedAt');
    }
  }

  async getDueToday(userId: string, date = new Date()): Promise<Task[]> {
    const all = await this.getAllByUser(userId);
    const start = startOfDay(date);
    const end = endOfDay(date);
    return all
      .filter((t) => !!t.dueAt && t.dueAt >= start && t.dueAt <= end && !t.completedAt)
      .sort((a, b) => (a.dueAt?.getTime() ?? 0) - (b.dueAt?.getTime() ?? 0));
  }

  async getOverdue(userId: string, date = new Date()): Promise<Task[]> {
    const all = await this.getAllByUser(userId);
    const start = startOfDay(date);
    return all
      .filter((t) => !!t.dueAt && t.dueAt < start && !t.completedAt)
      .sort((a, b) => (a.dueAt?.getTime() ?? 0) - (b.dueAt?.getTime() ?? 0));
  }

  async getUpcoming(userId: string, date = new Date()): Promise<Task[]> {
    const all = await this.getAllByUser(userId);
    const end = endOfDay(date);
    return all
      .filter((t) => !!t.dueAt && t.dueAt > end && !t.completedAt)
      .sort((a, b) => (a.dueAt?.getTime() ?? 0) - (b.dueAt?.getTime() ?? 0));
  }

  async getCompleted(userId: string, limit = 50): Promise<Task[]> {
    return (await this.getAllByUser(userId))
      .filter((t) => !!t.completedAt)
      .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))
      .slice(0, limit);
  }

  async getSubtasks(parentId: string): Promise<Task[]> {
    const t = await this.legacyTable();
    return t.where({ parentId }).reverse().sortBy('createdAt');
  }

  async complete(id: string): Promise<void> {
    await this.update(id, { status: 'done', completedAt: new Date() });
  }

  async uncomplete(id: string): Promise<void> {
    await this.update(id, { status: 'todo', completedAt: undefined });
  }

  async search(userId: string, query: string): Promise<Task[]> {
    const all = await this.getAllByUser(userId);
    const q = query.toLowerCase();
    return all.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.description?.toLowerCase().includes(q) ?? false),
    );
  }
}

class RemindersRepository extends BaseRepository<Reminder> {
  constructor() {
    super(async () => (await getDb()).reminders);
  }

  async getPending(userId: string, date = new Date()): Promise<Reminder[]> {
    const t = await this.table();
    return t
      .toCollection()
      .filter((r) => !r.isDone && !!r.remindAt && r.remindAt <= date)
      .reverse()
      .sortBy('remindAt');
  }

  async getByTask(taskId: string): Promise<Reminder[]> {
    const t = await this.table();
    return t.where({ taskId }).reverse().sortBy('remindAt');
  }
}

export const tasksRepo = new TasksRepository();
export const remindersRepo = new RemindersRepository();
