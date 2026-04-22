import { getDb } from '@/lib/db';
import { BaseRepository } from './base';
import type { Task, Reminder } from '@/types';
import { startOfDay, endOfDay } from 'date-fns';

class TasksRepository extends BaseRepository<Task> {
  constructor() {
    super(async () => (await getDb()).tasks);
  }

  async getByUser(userId: string): Promise<Task[]> {
    const t = await this.table();
    return t
      .where({ userId })
      .filter((t) => !t.completedAt)
      .reverse()
      .sortBy('updatedAt');
  }

  async getByStatus(userId: string, status: Task['status']): Promise<Task[]> {
    const t = await this.table();
    return t
      .where({ userId, status })
      .reverse()
      .sortBy('updatedAt');
  }

  async getDueToday(userId: string, date = new Date()): Promise<Task[]> {
    const t = await this.table();
    const start = startOfDay(date);
    const end = endOfDay(date);
    return t
      .where({ userId })
      .filter((t) => !!t.dueAt && t.dueAt >= start && t.dueAt <= end && !t.completedAt)
      .reverse()
      .sortBy('dueAt');
  }

  async getOverdue(userId: string, date = new Date()): Promise<Task[]> {
    const t = await this.table();
    const start = startOfDay(date);
    return t
      .where({ userId })
      .filter((t) => !!t.dueAt && t.dueAt < start && !t.completedAt)
      .reverse()
      .sortBy('dueAt');
  }

  async getUpcoming(userId: string, date = new Date()): Promise<Task[]> {
    const t = await this.table();
    const end = endOfDay(date);
    return t
      .where({ userId })
      .filter((t) => !!t.dueAt && t.dueAt > end && !t.completedAt)
      .reverse()
      .sortBy('dueAt');
  }

  async getCompleted(userId: string, limit = 50): Promise<Task[]> {
    const t = await this.table();
    return t
      .where({ userId })
      .filter((t) => !!t.completedAt)
      .reverse()
      .sortBy('completedAt')
      .then((items) => items.slice(0, limit));
  }

  async getSubtasks(parentId: string): Promise<Task[]> {
    const t = await this.table();
    return t
      .where({ parentId })
      .reverse()
      .sortBy('createdAt');
  }

  async complete(id: string): Promise<void> {
    const t = await this.table();
    await t.update(id as unknown as Parameters<typeof t.update>[0], { status: 'done', completedAt: new Date(), updatedAt: new Date() } as unknown as Parameters<typeof t.update>[1]);
  }

  async uncomplete(id: string): Promise<void> {
    const t = await this.table();
    await t.update(id as unknown as Parameters<typeof t.update>[0], { status: 'todo', completedAt: undefined, updatedAt: new Date() } as unknown as Parameters<typeof t.update>[1]);
  }

  async search(userId: string, query: string): Promise<Task[]> {
    const t = await this.table();
    const q = query.toLowerCase();
    return t
      .where({ userId })
      .filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false)
      )
      .reverse()
      .sortBy('updatedAt');
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
