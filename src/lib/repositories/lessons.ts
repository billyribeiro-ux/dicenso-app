import { getDb } from '@/lib/db';
import { BaseRepository } from './base';
import type { Lesson, LessonReview } from '@/types';

class LessonsRepository extends BaseRepository<Lesson> {
  constructor() {
    super(async () => (await getDb()).lessons);
  }

  async getByUser(userId: string): Promise<Lesson[]> {
    const t = await this.table();
    return t
      .where({ userId })
      .reverse()
      .sortBy('updatedAt');
  }

  async getByStatus(userId: string, status: Lesson['status']): Promise<Lesson[]> {
    const t = await this.table();
    return t
      .where({ userId, status })
      .reverse()
      .sortBy('updatedAt');
  }

  async getDueForReview(userId: string, date = new Date()): Promise<Lesson[]> {
    const t = await this.table();
    return t
      .where({ userId })
      .filter((l) => !!l.reviewAt && l.reviewAt <= date)
      .reverse()
      .sortBy('reviewAt');
  }

  async search(userId: string, query: string): Promise<Lesson[]> {
    const t = await this.table();
    const q = query.toLowerCase();
    return t
      .where({ userId })
      .filter((l) =>
        l.title.toLowerCase().includes(q) ||
        (l.summary?.toLowerCase().includes(q) ?? false) ||
        (l.body?.toLowerCase().includes(q) ?? false)
      )
      .reverse()
      .sortBy('updatedAt');
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
