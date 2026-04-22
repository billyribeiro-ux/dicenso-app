import { getDb } from '@/lib/db';
import { BaseRepository } from './base';
import type { Lesson, LessonReview } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import {
  createShared,
  deleteShared,
  getSharedById,
  listShared,
  updateShared,
  upsertManyShared,
} from '@/lib/shared-entity-client';

const LEGACY_LESSONS_MIGRATION_KEY = 'dicenso:lessons-migrated:v1';
const LESSON_DATE_FIELDS = ['createdAt', 'updatedAt', 'reviewAt'] as const;

class LessonsRepository {
  private migrationPromise: Promise<void> | null = null;

  private async legacyTable() {
    return (await getDb()).lessons;
  }

  private async ensureLegacyMigration(userId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(LEGACY_LESSONS_MIGRATION_KEY) === '1') return;
    if (this.migrationPromise) return this.migrationPromise;
    this.migrationPromise = (async () => {
      try {
        const legacy = await (await this.legacyTable()).where({ userId }).toArray();
        if (legacy.length > 0) {
          await upsertManyShared('lessons', legacy, LESSON_DATE_FIELDS);
        }
        localStorage.setItem(LEGACY_LESSONS_MIGRATION_KEY, '1');
      } finally {
        this.migrationPromise = null;
      }
    })();
    await this.migrationPromise;
  }

  async getById(id: string): Promise<Lesson | undefined> {
    try {
      return await getSharedById<Lesson>('lessons', id, LESSON_DATE_FIELDS);
    } catch {
      return (await this.legacyTable()).get(id);
    }
  }

  async create(entity: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lesson> {
    const now = new Date();
    const lesson: Lesson = { ...entity, id: uuidv4(), createdAt: now, updatedAt: now };
    try {
      return await createShared<Lesson>('lessons', lesson, LESSON_DATE_FIELDS);
    } catch {
      await (await this.legacyTable()).add(lesson);
      return lesson;
    }
  }

  async update(
    id: string,
    changes: Partial<Omit<Lesson, 'id' | 'createdAt'>>,
  ): Promise<Lesson | undefined> {
    const payload: Record<string, unknown> = { ...changes, updatedAt: new Date() };
    try {
      return await updateShared<Lesson>('lessons', id, payload, LESSON_DATE_FIELDS);
    } catch {
      const t = await this.legacyTable();
      await t.update(id, { ...(changes as Partial<Lesson>), updatedAt: new Date() });
      return t.get(id);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteShared('lessons', id);
    } catch {
      await (await this.legacyTable()).delete(id);
    }
  }

  async getByUser(userId: string): Promise<Lesson[]> {
    await this.ensureLegacyMigration(userId);
    try {
      return await listShared<Lesson>('lessons', userId, LESSON_DATE_FIELDS);
    } catch {
      return (await this.legacyTable()).where({ userId }).reverse().sortBy('updatedAt');
    }
  }

  async getByStatus(userId: string, status: Lesson['status']): Promise<Lesson[]> {
    const all = await this.getByUser(userId);
    return all.filter((l) => l.status === status);
  }

  async getDueForReview(userId: string, date = new Date()): Promise<Lesson[]> {
    return (await this.getByUser(userId))
      .filter((l) => !!l.reviewAt && l.reviewAt <= date)
      .sort((a, b) => (a.reviewAt?.getTime() ?? 0) - (b.reviewAt?.getTime() ?? 0));
  }

  async search(userId: string, query: string): Promise<Lesson[]> {
    const all = await this.getByUser(userId);
    const q = query.toLowerCase();
    return all.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.summary?.toLowerCase().includes(q) ?? false) ||
        (l.body?.toLowerCase().includes(q) ?? false),
    );
  }
}

class LessonReviewsRepository extends BaseRepository<LessonReview> {
  constructor() {
    super(async () => (await getDb()).lessonReviews);
  }

  async getByLesson(lessonId: string): Promise<LessonReview[]> {
    const t = await this.table();
    return t
      .where({ lessonId })
      .reverse()
      .sortBy('createdAt');
  }
}

export const lessonsRepo = new LessonsRepository();
export const lessonReviewsRepo = new LessonReviewsRepository();
